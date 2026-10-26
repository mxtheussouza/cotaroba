import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { verifyPassword } from "better-auth/crypto";
import { z } from "zod";

import { createAuth, handleAuthRequest } from "@/features/auth/auth";
import {
  AccessDeniedError,
  resolveSessionUser,
} from "@/features/auth/authorization";
import {
  createAccess,
  createRegion,
  createSlaughterhouse,
  getSlaughterhouse,
  listRegions,
  listSlaughterhouses,
  ManagementError,
  resetAccessPassword,
  updateAccess,
  updateSlaughterhouse,
} from "@/features/slaughterhouses/service";
import { getDatabase } from "@/lib/db";
import { consumeManagementRateLimit } from "@/features/slaughterhouses/rate-limit";

import { createAuthFixtures } from "./helpers/auth-fixtures";
import { getTestDatabaseUrl } from "./helpers/database";

const originalUrl = process.env.DATABASE_URL;
const origin = "http://localhost:3000";
let database: ReturnType<typeof getDatabase>;
let fixtures: Awaited<ReturnType<typeof createAuthFixtures>>;
let auth: ReturnType<typeof createAuth>;
let requestId = 0;

function email() {
  return `${randomUUID()}@example.invalid`;
}
function managementError(code: ManagementError["code"]) {
  return (error: unknown) =>
    error instanceof ManagementError && error.code === code;
}
function accessInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Responsável de teste",
    email: email(),
    password: fixtures.password,
    ...overrides,
  };
}
function companyInput(overrides: Record<string, unknown> = {}) {
  return {
    name: `Frigorífico QA ${randomUUID()}`,
    regionId: fixtures.slaughterhouses[0].regionId,
    ...overrides,
  };
}

async function signIn(userEmail: string, password = fixtures.password) {
  const response = await handleAuthRequest(
    new Request(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/json",
        "x-forwarded-for": `198.19.1.${++requestId}`,
      },
      body: JSON.stringify({ email: userEmail, password, rememberMe: false }),
    }),
    auth,
  );
  const cookie =
    response.headers
      .getSetCookie()
      .find((value) => value.startsWith("cotaroba.session_token="))
      ?.split(";")[0] ?? "";
  return { response, headers: new Headers({ cookie }) };
}

describe(
  "Manager registration and access administration",
  { concurrency: false },
  () => {
    before(async () => {
      process.env.DATABASE_URL = getTestDatabaseUrl();
      database = getDatabase();
      fixtures = await createAuthFixtures(database);
      auth = createAuth(database, {
        baseURL: origin,
        secret: randomBytes(32).toString("hex"),
      });
    });
    after(async () => {
      await fixtures?.cleanup();
      if (database) {
        await database.rateLimit.deleteMany({
          where: { key: { startsWith: "198.19.1." } },
        });
        await database.$disconnect();
      }
      if (originalUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalUrl;
    });

    it("lets a manager register, list and read a slaughterhouse with a valid region", async () => {
      const data = companyInput({ name: "  Unidade de teste  " });
      const created = await createSlaughterhouse(
        database,
        fixtures.manager.id,
        data,
      );
      const record = await getSlaughterhouse(
        database,
        fixtures.manager.id,
        created.id,
      );
      assert.equal(record.name, "Unidade de teste");
      assert.equal(record.isActive, true);
      assert.deepEqual(record.users, []);
      const list = await listSlaughterhouses(database, fixtures.manager.id);
      assert.ok(list.items.some((item) => item.id === record.id));
      assert.ok(
        (await listRegions(database, fixtures.manager.id)).some(
          (region) => region.id === data.regionId,
        ),
      );
    });

    it("rejects visitors and the slaughterhouse profile in every protected operation", async () => {
      for (const actor of ["", fixtures.users[0].id]) {
        const id = fixtures.slaughterhouses[0].id;
        const operations = [
          () =>
            createRegion(database, actor, { name: `Negada ${randomUUID()}` }),
          () => listRegions(database, actor),
          () => listSlaughterhouses(database, actor),
          () => getSlaughterhouse(database, actor, id),
          () => createSlaughterhouse(database, actor, companyInput()),
          () =>
            updateSlaughterhouse(database, actor, id, {
              ...companyInput(),
              isActive: true,
            }),
          () => createAccess(database, actor, id, accessInput()),
          () =>
            updateAccess(database, actor, id, fixtures.users[0].id, {
              name: "Tentativa",
              email: email(),
              isActive: true,
            }),
          () =>
            resetAccessPassword(database, actor, id, fixtures.users[0].id, {
              password: fixtures.password,
            }),
        ];
        for (const operation of operations)
          await assert.rejects(operation(), AccessDeniedError);
      }
    });

    it("atomically limits administrative writes per manager and resets the fixed window", async () => {
      const now = Date.now();
      const results = await Promise.all(
        Array.from({ length: 40 }, () =>
          consumeManagementRateLimit(database, fixtures.manager.id, now),
        ),
      );
      assert.equal(results.filter(Boolean).length, 30);
      assert.equal(
        await consumeManagementRateLimit(
          database,
          fixtures.manager.id,
          now + 59_999,
        ),
        false,
      );
      assert.equal(
        await consumeManagementRateLimit(
          database,
          fixtures.manager.id,
          now + 60_000,
        ),
        true,
      );
      await database.rateLimit.deleteMany({
        where: { key: `management:${fixtures.manager.id}` },
      });
    });

    it("rechecks the actor's current active state instead of trusting a previous session", async () => {
      await database.user.update({
        where: { id: fixtures.manager.id },
        data: { isActive: false },
      });
      try {
        await assert.rejects(
          createSlaughterhouse(database, fixtures.manager.id, companyInput()),
          AccessDeniedError,
        );
      } finally {
        await database.user.update({
          where: { id: fixtures.manager.id },
          data: { isActive: true },
        });
      }
    });

    it("rejects missing, oversized and forged fields and invalid/missing regions without saving", async () => {
      const count = await database.slaughterhouse.count();
      for (const input of [
        companyInput({ name: "  " }),
        companyInput({ name: "a".repeat(161) }),
        companyInput({ regionId: "bad-id" }),
        companyInput({ isActive: true }),
      ])
        await assert.rejects(
          createSlaughterhouse(database, fixtures.manager.id, input),
          z.ZodError,
        );
      await assert.rejects(
        createSlaughterhouse(
          database,
          fixtures.manager.id,
          companyInput({ regionId: randomUUID() }),
        ),
        managementError("regiao"),
      );
      assert.equal(await database.slaughterhouse.count(), count);
    });

    it("creates manager-defined regions, normalizes whitespace/Unicode and makes them available for registration", async () => {
      const name = `Região QA ${randomUUID()}`;
      const region = await createRegion(database, fixtures.manager.id, {
        name: `  ${name.replace(" ", "   ").normalize("NFD")}  `,
      });
      const stored = await database.region.findUniqueOrThrow({
        where: { id: region.id },
      });
      assert.equal(stored.name, name);
      assert.ok(
        (await listRegions(database, fixtures.manager.id)).some(
          (item) => item.id === region.id,
        ),
      );
      const company = await createSlaughterhouse(
        database,
        fixtures.manager.id,
        companyInput({ regionId: region.id }),
      );
      assert.equal(
        (await getSlaughterhouse(database, fixtures.manager.id, company.id))
          .regionId,
        region.id,
      );
    });

    it("rejects empty, oversized and unexpected region data without creating history", async () => {
      const before = await database.managementEvent.count();
      for (const name of ["  ", "r".repeat(121), null])
        await assert.rejects(
          createRegion(database, fixtures.manager.id, { name }),
          z.ZodError,
        );
      await assert.rejects(
        createRegion(database, fixtures.manager.id, {
          name: "QA",
          id: randomUUID(),
        }),
        z.ZodError,
      );
      assert.equal(await database.managementEvent.count(), before);
    });

    it("rejects case-only duplicate regions atomically under simultaneous submissions", async () => {
      const name = `Região concorrente ${randomUUID()}`;
      const results = await Promise.allSettled([
        createRegion(database, fixtures.manager.id, { name }),
        createRegion(database, fixtures.manager.id, {
          name: `  ${name.toUpperCase().replace(" ", "  ")} `,
        }),
      ]);
      assert.equal(
        results.filter((result) => result.status === "fulfilled").length,
        1,
      );
      const failure = results.find(
        (result) => result.status === "rejected",
      ) as PromiseRejectedResult;
      assert.ok(managementError("regiao-duplicada")(failure.reason));
      assert.equal(
        await database.region.count({
          where: { name: { equals: name, mode: "insensitive" } },
        }),
        1,
      );
    });

    it("creates a working normalized credential, fixes the profile/link, and returns no password", async () => {
      const data = accessInput({ email: `  ${email().toUpperCase()}  ` });
      const created = await createAccess(
        database,
        fixtures.manager.id,
        fixtures.slaughterhouses[0].id,
        data,
      );
      assert.deepEqual(Object.keys(created), ["id"]);
      const user = await database.user.findUniqueOrThrow({
        where: { id: created.id },
        include: { accounts: true },
      });
      assert.equal(user.email, String(data.email).trim().toLowerCase());
      assert.equal(user.role, "SLAUGHTERHOUSE");
      assert.equal(user.slaughterhouseId, fixtures.slaughterhouses[0].id);
      assert.notEqual(user.accounts[0].password, fixtures.password);
      assert.ok(
        await verifyPassword({
          hash: user.accounts[0].password!,
          password: fixtures.password,
        }),
      );
      const login = await signIn(user.email);
      assert.equal(login.response.status, 200);
      const identity = await resolveSessionUser(database, auth, login.headers);
      assert.equal(identity?.slaughterhouseId, fixtures.slaughterhouses[0].id);
      const dto = await getSlaughterhouse(
        database,
        fixtures.manager.id,
        fixtures.slaughterhouses[0].id,
      );
      assert.ok(!JSON.stringify(dto).includes(user.accounts[0].password!));
      assert.ok(!JSON.stringify(dto).includes('"accounts"'));
    });

    it("validates access email, password and server-owned fields at the boundary", async () => {
      const count = await database.user.count();
      for (const data of [
        accessInput({ email: "bad" }),
        accessInput({ password: "short" }),
        accessInput({ password: "a".repeat(129) }),
        accessInput({ role: "MANAGER" }),
        accessInput({ slaughterhouseId: fixtures.slaughterhouses[1].id }),
      ])
        await assert.rejects(
          createAccess(
            database,
            fixtures.manager.id,
            fixtures.slaughterhouses[0].id,
            data,
          ),
          z.ZodError,
        );
      assert.equal(await database.user.count(), count);
    });

    it("handles duplicate emails atomically, including simultaneous attempts", async () => {
      const data = accessInput();
      const [a, b] = await Promise.allSettled([
        createAccess(
          database,
          fixtures.manager.id,
          fixtures.slaughterhouses[0].id,
          data,
        ),
        createAccess(
          database,
          fixtures.manager.id,
          fixtures.slaughterhouses[1].id,
          data,
        ),
      ]);
      assert.equal(
        [a, b].filter((result) => result.status === "fulfilled").length,
        1,
      );
      const rejected = [a, b].find(
        (result) => result.status === "rejected",
      ) as PromiseRejectedResult;
      assert.ok(managementError("email")(rejected.reason));
      assert.equal(
        await database.user.count({ where: { email: data.email as string } }),
        1,
      );
      const user = await database.user.findUniqueOrThrow({
        where: { email: data.email as string },
        include: { accounts: true, accessManagementEvents: true },
      });
      assert.equal(user.accounts.length, 1);
      assert.equal(user.accessManagementEvents.length, 1);
    });

    it("prevents moving accesses across slaughterhouses or editing a manager through access operations", async () => {
      for (const userId of [
        fixtures.users[1].id,
        fixtures.manager.id,
        randomUUID(),
      ]) {
        await assert.rejects(
          updateAccess(
            database,
            fixtures.manager.id,
            fixtures.slaughterhouses[0].id,
            userId,
            { name: "Inválido", email: email(), isActive: false },
          ),
          managementError("nao-encontrado"),
        );
        await assert.rejects(
          resetAccessPassword(
            database,
            fixtures.manager.id,
            fixtures.slaughterhouses[0].id,
            userId,
            { password: fixtures.password },
          ),
          managementError("nao-encontrado"),
        );
      }
      assert.equal(
        (
          await database.user.findUniqueOrThrow({
            where: { id: fixtures.users[1].id },
          })
        ).isActive,
        true,
      );
    });

    it("updates access identity and revokes sessions, while an email conflict rolls back all changes", async () => {
      const created = await createAccess(
        database,
        fixtures.manager.id,
        fixtures.slaughterhouses[0].id,
        accessInput(),
      );
      const user = await database.user.findUniqueOrThrow({
        where: { id: created.id },
      });
      const signedIn = await signIn(user.email);
      await assert.rejects(
        updateAccess(
          database,
          fixtures.manager.id,
          user.slaughterhouseId!,
          user.id,
          {
            name: "Não salvar",
            email: fixtures.manager.email,
            isActive: false,
          },
        ),
        managementError("email"),
      );
      assert.ok(await resolveSessionUser(database, auth, signedIn.headers));
      const nextEmail = email();
      await updateAccess(
        database,
        fixtures.manager.id,
        user.slaughterhouseId!,
        user.id,
        { name: "Responsável editado", email: nextEmail, isActive: true },
      );
      assert.equal(
        await resolveSessionUser(database, auth, signedIn.headers),
        null,
      );
      assert.equal((await signIn(user.email)).response.status, 401);
      assert.equal((await signIn(nextEmail)).response.status, 200);
    });

    it("deactivates and reactivates an individual access without reviving its old session", async () => {
      const data = accessInput();
      const user = await createAccess(
        database,
        fixtures.manager.id,
        fixtures.slaughterhouses[0].id,
        data,
      );
      const signedIn = await signIn(data.email as string);
      const update = { name: data.name, email: data.email, isActive: false };
      await updateAccess(
        database,
        fixtures.manager.id,
        fixtures.slaughterhouses[0].id,
        user.id,
        update,
      );
      assert.equal(
        await resolveSessionUser(database, auth, signedIn.headers),
        null,
      );
      assert.equal((await signIn(data.email as string)).response.status, 401);
      await updateAccess(
        database,
        fixtures.manager.id,
        fixtures.slaughterhouses[0].id,
        user.id,
        { ...update, isActive: true },
      );
      assert.equal(
        await resolveSessionUser(database, auth, signedIn.headers),
        null,
      );
      assert.equal((await signIn(data.email as string)).response.status, 200);
    });

    it("resets an access password, revokes its sessions and preserves other accounts", async () => {
      const data = accessInput();
      const companyId = fixtures.slaughterhouses[0].id;
      const user = await createAccess(
        database,
        fixtures.manager.id,
        companyId,
        data,
      );
      const signedIn = await signIn(data.email as string);
      const other = await signIn(fixtures.users[1].email);
      const replacement = randomUUID() + "-new";
      await resetAccessPassword(
        database,
        fixtures.manager.id,
        companyId,
        user.id,
        { password: replacement },
      );
      assert.equal(
        await resolveSessionUser(database, auth, signedIn.headers),
        null,
      );
      assert.equal((await signIn(data.email as string)).response.status, 401);
      assert.equal(
        (await signIn(data.email as string, replacement)).response.status,
        200,
      );
      assert.ok(await resolveSessionUser(database, auth, other.headers));
    });

    it("deactivates a company, blocks logins/new accounts and retains individually disabled accesses on reactivation", async () => {
      const company = await createSlaughterhouse(
        database,
        fixtures.manager.id,
        companyInput(),
      );
      const data = accessInput();
      const user = await createAccess(
        database,
        fixtures.manager.id,
        company.id,
        data,
      );
      const signedIn = await signIn(data.email as string);
      const record = await getSlaughterhouse(
        database,
        fixtures.manager.id,
        company.id,
      );
      const fields = {
        name: record.name,
        regionId: record.regionId,
        isActive: false,
      };
      await updateSlaughterhouse(
        database,
        fixtures.manager.id,
        company.id,
        fields,
      );
      assert.equal(
        await resolveSessionUser(database, auth, signedIn.headers),
        null,
      );
      assert.equal((await signIn(data.email as string)).response.status, 401);
      await assert.rejects(
        createAccess(database, fixtures.manager.id, company.id, accessInput()),
        managementError("inativo"),
      );
      await updateAccess(database, fixtures.manager.id, company.id, user.id, {
        name: data.name,
        email: data.email,
        isActive: false,
      });
      await updateSlaughterhouse(database, fixtures.manager.id, company.id, {
        ...fields,
        isActive: true,
      });
      assert.equal(
        await resolveSessionUser(database, auth, signedIn.headers),
        null,
      );
      assert.equal((await signIn(data.email as string)).response.status, 401);
    });

    it("preserves historical quote region and price when the company changes region or is deactivated", async () => {
      const company = await createSlaughterhouse(
        database,
        fixtures.manager.id,
        companyInput(),
      );
      const region = await database.region.create({
        data: { name: `Mudança QA ${randomUUID()}` },
      });
      const category = await database.cattleCategory.create({
        data: { name: `Categoria QA ${randomUUID()}` },
      });
      const quote = await database.quote.create({
        data: {
          slaughterhouseId: company.id,
          regionId: fixtures.slaughterhouses[0].regionId,
          categoryId: category.id,
          pricePerArroba: "301.27",
          referenceDate: new Date("2026-10-26"),
        },
      });
      try {
        await updateSlaughterhouse(database, fixtures.manager.id, company.id, {
          name: "Unidade movida",
          regionId: region.id,
          isActive: false,
        });
        const preserved = await database.quote.findUniqueOrThrow({
          where: { id: quote.id },
        });
        assert.equal(preserved.regionId, quote.regionId);
        assert.equal(preserved.pricePerArroba.toFixed(2), "301.27");
        assert.equal(
          (await getSlaughterhouse(database, fixtures.manager.id, company.id))
            .name,
          "Unidade movida",
        );
      } finally {
        await database.quote.delete({ where: { id: quote.id } });
        await database.cattleCategory.delete({ where: { id: category.id } });
        await database.slaughterhouse.update({
          where: { id: company.id },
          data: { regionId: quote.regionId },
        });
        await database.region.delete({ where: { id: region.id } });
      }
    });

    it("paginates private results deterministically and returns no credentials or quote records", async () => {
      const ids = Array.from({ length: 22 }, () => randomUUID());
      await database.slaughterhouse.createMany({
        data: ids.map((id) => ({
          id,
          name: `ZZ QA ${id}`,
          regionId: fixtures.slaughterhouses[0].regionId,
        })),
      });
      try {
        const first = await listSlaughterhouses(
          database,
          fixtures.manager.id,
          1,
        );
        const second = await listSlaughterhouses(
          database,
          fixtures.manager.id,
          2,
        );
        assert.equal(first.items.length, 20);
        assert.ok(second.items.length > 0);
        assert.ok(
          !second.items.some((item) =>
            first.items.some((previous) => previous.id === item.id),
          ),
        );
        assert.equal(
          (await listSlaughterhouses(database, fixtures.manager.id, Number.NaN))
            .page,
          1,
        );
        for (const item of first.items)
          assert.deepEqual(Object.keys(item).sort(), [
            "_count",
            "id",
            "isActive",
            "name",
            "region",
          ]);
      } finally {
        await database.slaughterhouse.deleteMany({
          where: { id: { in: ids } },
        });
      }
    });

    it("keeps administrative history with an actor and safe changes, without passwords, hashes or tokens", async () => {
      const events = await database.managementEvent.findMany({
        where: { actorId: fixtures.manager.id },
      });
      assert.ok(events.some((event) => event.action === "REGION_CREATED"));
      assert.ok(
        events.some((event) => event.action === "SLAUGHTERHOUSE_CREATED"),
      );
      assert.ok(
        events.some((event) => event.action === "SLAUGHTERHOUSE_UPDATED"),
      );
      assert.ok(events.some((event) => event.action === "ACCESS_CREATED"));
      assert.ok(events.some((event) => event.action === "ACCESS_UPDATED"));
      assert.ok(
        events.some((event) => event.action === "ACCESS_PASSWORD_RESET"),
      );
      const serialized = JSON.stringify(events);
      assert.ok(!serialized.includes(fixtures.password));
      for (const name of ['"password"', '"token"', '"accounts"', '"sessions"'])
        assert.ok(!serialized.includes(name));
    });
  },
);
