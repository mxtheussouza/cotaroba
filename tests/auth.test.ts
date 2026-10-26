import assert from "node:assert/strict";
import { randomBytes, randomUUID, randomInt } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { verifyPassword } from "better-auth/crypto";

import { createAuth, handleAuthRequest } from "@/features/auth/auth";
import {
  AccessDeniedError,
  assertRole,
  resolveSessionUser,
} from "@/features/auth/authorization";
import {
  createInitialManager,
  InitialManagerExistsError,
} from "@/features/auth/bootstrap";
import { parseAuthConfig } from "@/features/auth/schema";
import { getDatabase } from "@/lib/db";

import { createAuthFixtures } from "./helpers/auth-fixtures";
import { getTestDatabaseUrl } from "./helpers/database";

const originalUrl = process.env.DATABASE_URL;
const origin = "http://localhost:3000";
const ipPrefix = `198.18.${randomInt(1, 255)}.`;
let database: ReturnType<typeof getDatabase>;
let auth: ReturnType<typeof createAuth>;
let fixtures: Awaited<ReturnType<typeof createAuthFixtures>>;
let nextIp = 1;

function client() {
  const ip = ipPrefix + nextIp++;
  let cookie = "";
  return {
    get cookie() {
      return cookie;
    },
    headers() {
      return new Headers({ cookie, "x-forwarded-for": ip });
    },
    async request(
      path: string,
      body: unknown = {},
      extra: Record<string, string> = {},
    ) {
      const response = await handleAuthRequest(
        new Request(`${origin}/api/auth${path}`, {
          method: "POST",
          headers: {
            origin,
            "content-type": "application/json",
            "x-forwarded-for": ip,
            cookie,
            ...extra,
          },
          body: JSON.stringify(body),
        }),
        auth,
      );
      const tokenCookie = response.headers
        .getSetCookie()
        .find((value) => value.startsWith("cotaroba.session_token="));
      if (tokenCookie) cookie = tokenCookie.split(";")[0];
      return response;
    },
    signIn(email: string, extra: Record<string, unknown> = {}) {
      return this.request("/sign-in/email", {
        email,
        password: fixtures.password,
        rememberMe: false,
        ...extra,
      });
    },
  };
}

describe("Authentication and permissions", { concurrency: false }, () => {
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
        where: { key: { startsWith: ipPrefix } },
      });
      await database.$disconnect();
    }
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
  });

  it("bootstraps a manager with a verified password hash and refuses a second bootstrap", async () => {
    const account = await database.account.findFirstOrThrow({
      where: { userId: fixtures.manager.id },
    });
    assert.notEqual(account.password, fixtures.password);
    assert.ok(
      await verifyPassword({
        hash: account.password!,
        password: fixtures.password,
      }),
    );
    await assert.rejects(
      createInitialManager(database, {
        name: "Outro",
        email: "outro@example.invalid",
        password: fixtures.password,
      }),
      InitialManagerExistsError,
    );
  });

  it("rejects a visitor for both private roles", async () => {
    const user = await resolveSessionUser(database, auth, new Headers());
    assert.equal(user, null);
    for (const role of ["MANAGER", "SLAUGHTERHOUSE"] as const) {
      assert.throws(
        () => assertRole(user, role),
        (error: unknown) =>
          error instanceof AccessDeniedError && error.status === 401,
      );
    }
  });

  it("logs a manager in with an HttpOnly, SameSite cookie and checks role on the server", async () => {
    const browser = client();
    const response = await browser.signIn(fixtures.manager.email);
    assert.equal(response.status, 200, await response.text());
    const setCookie = response.headers.get("set-cookie")!;
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    const user = await resolveSessionUser(database, auth, browser.headers());
    assertRole(user, "MANAGER");
    assert.equal(user.id, fixtures.manager.id);
    const session = await auth.api.getSession({ headers: browser.headers() });
    assert.ok(
      session!.session.expiresAt.getTime() - Date.now() <= 8 * 60 * 60 * 1000,
    );
    assert.throws(
      () => assertRole(user, "SLAUGHTERHOUSE"),
      (error: unknown) =>
        error instanceof AccessDeniedError && error.status === 403,
    );
  });

  it("ignores forged role and slaughterhouse fields and isolates the authenticated identity", async () => {
    for (const [index, member] of fixtures.users.entries()) {
      const browser = client();
      const response = await browser.signIn(member.email, {
        role: "MANAGER",
        slaughterhouseId: fixtures.slaughterhouses[1 - index].id,
      });
      assert.equal(response.status, 200, await response.text());
      const user = await resolveSessionUser(database, auth, browser.headers());
      assertRole(user, "SLAUGHTERHOUSE");
      assert.equal(user.slaughterhouseId, member.slaughterhouseId);
      assert.equal(user.slaughterhouse?.id, member.slaughterhouseId);
      assert.throws(() => assertRole(user, "MANAGER"), AccessDeniedError);
    }
  });

  it("returns the same error for unknown email and an incorrect password", async () => {
    const invalidPassword = await client().request("/sign-in/email", {
      email: fixtures.manager.email,
      password: "wrong-password",
    });
    const invalidEmail = await client().request("/sign-in/email", {
      email: `${randomUUID()}@example.invalid`,
      password: "wrong-password",
    });
    assert.equal(invalidPassword.status, 401);
    assert.equal(invalidEmail.status, 401);
    assert.deepEqual(await invalidPassword.json(), await invalidEmail.json());
  });

  it("rejects a tampered session cookie", async () => {
    const browser = client();
    assert.equal((await browser.signIn(fixtures.manager.email)).status, 200);
    const headers = browser.headers();
    headers.set("cookie", browser.cookie.slice(0, -3) + "xyz");
    assert.equal(await resolveSessionUser(database, auth, headers), null);
  });

  it("rejects an expired persisted session", async () => {
    const browser = client();
    assert.equal((await browser.signIn(fixtures.manager.email)).status, 200);
    const user = await auth.api.getSession({ headers: browser.headers() });
    await database.session.update({
      where: { id: user!.session.id },
      data: { expiresAt: new Date(0) },
    });
    assert.equal(
      await resolveSessionUser(database, auth, browser.headers()),
      null,
    );
  });

  it("revokes the persisted session on logout and rejects replay of the old cookie", async () => {
    const browser = client();
    assert.equal((await browser.signIn(fixtures.manager.email)).status, 200);
    const headers = browser.headers();
    const response = await browser.request("/sign-out");
    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie")!, /Max-Age=0/i);
    assert.equal(await resolveSessionUser(database, auth, headers), null);
  });

  it("denies disabled users immediately and refuses a new login", async () => {
    const browser = client();
    const member = fixtures.users[0];
    assert.equal((await browser.signIn(member.email)).status, 200);
    try {
      await database.user.update({
        where: { id: member.id },
        data: { isActive: false },
      });
      assert.equal(
        await resolveSessionUser(database, auth, browser.headers()),
        null,
      );
      assert.equal((await client().signIn(member.email)).status, 401);
    } finally {
      await database.user.update({
        where: { id: member.id },
        data: { isActive: true },
      });
    }
  });

  it("denies members of an inactive slaughterhouse immediately and on new login", async () => {
    const browser = client();
    assert.equal((await browser.signIn(fixtures.users[0].email)).status, 200);
    try {
      await database.slaughterhouse.update({
        where: { id: fixtures.slaughterhouses[0].id },
        data: { isActive: false },
      });
      assert.equal(
        await resolveSessionUser(database, auth, browser.headers()),
        null,
      );
      assert.equal(
        (await client().signIn(fixtures.users[0].email)).status,
        401,
      );
    } finally {
      await database.slaughterhouse.update({
        where: { id: fixtures.slaughterhouses[0].id },
        data: { isActive: true },
      });
    }
  });

  it("uses updated privileges instead of the role at login", async () => {
    const browser = client();
    assert.equal((await browser.signIn(fixtures.manager.email)).status, 200);
    try {
      await database.user.update({
        where: { id: fixtures.manager.id },
        data: {
          role: "SLAUGHTERHOUSE",
          slaughterhouseId: fixtures.slaughterhouses[0].id,
        },
      });
      const user = await resolveSessionUser(database, auth, browser.headers());
      assertRole(user, "SLAUGHTERHOUSE");
      assert.throws(() => assertRole(user, "MANAGER"), AccessDeniedError);
    } finally {
      await database.user.update({
        where: { id: fixtures.manager.id },
        data: { role: "MANAGER", slaughterhouseId: null },
      });
    }
  });

  it("exposes no signup, profile mutation or session listing over HTTP", async () => {
    const count = await database.user.count();
    for (const path of [
      "/sign-up/email",
      "/update-user",
      "/get-session",
      "/list-sessions",
    ]) {
      assert.equal(
        (
          await client().request(path, {
            role: "MANAGER",
            email: "invasor@example.invalid",
            password: fixtures.password,
          })
        ).status,
        404,
      );
    }
    assert.equal(await database.user.count(), count);
  });

  it("blocks login and logout from a foreign origin", async () => {
    const browser = client();
    const login = await browser.request(
      "/sign-in/email",
      { email: fixtures.manager.email, password: fixtures.password },
      { origin: "https://example.invalid" },
    );
    assert.equal(login.status, 403);
    assert.equal((await browser.signIn(fixtures.manager.email)).status, 200);
    assert.equal(
      (
        await browser.request(
          "/sign-out",
          {},
          { origin: "https://example.invalid" },
        )
      ).status,
      403,
    );
    assert.ok(await resolveSessionUser(database, auth, browser.headers()));
  });

  it("atomically limits login attempts to five per minute in PostgreSQL", async () => {
    const browser = client();
    const responses = await Promise.all(
      Array.from({ length: 6 }, () =>
        browser.request("/sign-in/email", {
          email: fixtures.manager.email,
          password: "wrong-password",
        }),
      ),
    );
    assert.equal(
      responses.filter((response) => response.status === 429).length,
      1,
    );
    assert.equal(
      responses.filter((response) => response.status === 401).length,
      5,
    );
    const limits = await database.rateLimit.findMany({
      where: { key: { startsWith: ipPrefix } },
    });
    assert.ok(limits.some((limit) => limit.count === 5));
  });

  it("enforces consistent role/slaughterhouse relationships in SQL", async () => {
    for (const data of [
      {
        role: "MANAGER" as const,
        slaughterhouseId: fixtures.slaughterhouses[0].id,
      },
      { role: "SLAUGHTERHOUSE" as const, slaughterhouseId: null },
    ]) {
      await assert.rejects(
        database.user.create({
          data: {
            ...data,
            name: "Inválido",
            email: `${randomUUID()}@example.invalid`,
          },
        }),
        /User_role_slaughterhouse_link/,
      );
    }
  });

  it("requires a private secret and HTTPS outside loopback without leaking configuration", () => {
    assert.throws(
      () =>
        parseAuthConfig({
          BETTER_AUTH_URL: origin,
          BETTER_AUTH_SECRET: "short",
        }),
      /Configure BETTER_AUTH_URL/,
    );
    assert.throws(
      () =>
        parseAuthConfig({
          BETTER_AUTH_URL: "http://example.invalid",
          BETTER_AUTH_SECRET: "s".repeat(64),
        }),
      /origem HTTPS/,
    );
  });

  it("marks session cookies Secure when the configured origin uses HTTPS", async () => {
    const secureOrigin = "https://cotaroba.example.invalid";
    const secureAuth = createAuth(database, {
      baseURL: secureOrigin,
      secret: randomBytes(32).toString("hex"),
    });
    const response = await handleAuthRequest(
      new Request(`${secureOrigin}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          origin: secureOrigin,
          "content-type": "application/json",
          "x-forwarded-for": ipPrefix + nextIp++,
        },
        body: JSON.stringify({
          email: fixtures.manager.email,
          password: fixtures.password,
        }),
      }),
      secureAuth,
    );
    assert.equal(response.status, 200, await response.text());
    assert.match(
      response.headers.get("set-cookie")!,
      /__Secure-cotaroba\.session_token=/,
    );
    assert.match(response.headers.get("set-cookie")!, /; Secure/i);
  });
});
