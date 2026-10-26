import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { z } from "zod";

import { AccessDeniedError } from "@/features/auth/authorization";
import {
  formatPrice,
  formatReferenceDate,
  todayInBahia,
} from "@/features/quotes/format";
import { consumeQuoteRateLimit } from "@/features/quotes/rate-limit";
import {
  createQuote,
  getQuoteHistory,
  getQuoteWorkspace,
  QuoteError,
  reviseQuote,
} from "@/features/quotes/service";
import {
  createAccess,
  createCategory,
  createRegion,
  listCategoriesForManager,
  ManagementError,
  updateAccess,
  updateSlaughterhouse,
} from "@/features/slaughterhouses/service";
import { getDatabase } from "@/lib/db";

import { createAuthFixtures } from "./helpers/auth-fixtures";
import { getTestDatabaseUrl } from "./helpers/database";

const originalUrl = process.env.DATABASE_URL;
let database: ReturnType<typeof getDatabase>;
let fixtures: Awaited<ReturnType<typeof createAuthFixtures>>;
let categoryId: string;
let coworkerId: string;

function input(overrides: Record<string, unknown> = {}) {
  return {
    categoryId,
    pricePerArroba: "301,27",
    referenceDate: "2026-10-26",
    ...overrides,
  };
}
function quoteError(code: QuoteError["code"]) {
  return (error: unknown) => error instanceof QuoteError && error.code === code;
}

describe(
  "Private quotes and immutable application history",
  { concurrency: false },
  () => {
    before(async () => {
      process.env.DATABASE_URL = getTestDatabaseUrl();
      database = getDatabase();
      fixtures = await createAuthFixtures(database);
      categoryId = (
        await createCategory(database, fixtures.manager.id, {
          name: `Categoria QA ${randomUUID()}`,
        })
      ).id;
      coworkerId = (
        await createAccess(
          database,
          fixtures.manager.id,
          fixtures.slaughterhouses[0].id,
          {
            name: "Colega de teste",
            email: `${randomUUID()}@example.invalid`,
            password: fixtures.password,
          },
        )
      ).id;
    });
    after(async () => {
      await fixtures?.cleanup();
      await database?.$disconnect();
      if (originalUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalUrl;
    });

    it("lets the manager define normalized categories and makes them available to members", async () => {
      const name = `Categoria pecuária ${randomUUID()}`;
      const category = await createCategory(database, fixtures.manager.id, {
        name: `  ${name.replace(" ", "   ").normalize("NFD")}  `,
      });
      assert.equal(
        (await listCategoriesForManager(database, fixtures.manager.id)).find(
          (item) => item.id === category.id,
        )?.name,
        name,
      );
      assert.ok(
        (
          await getQuoteWorkspace(database, fixtures.users[0].id)
        ).categories.some((item) => item.id === category.id),
      );
    });

    it("validates category names and rejects unauthorized category creation/listing", async () => {
      for (const actorId of ["", fixtures.users[0].id]) {
        await assert.rejects(
          createCategory(database, actorId, { name: "Inválida" }),
          AccessDeniedError,
        );
        await assert.rejects(
          listCategoriesForManager(database, actorId),
          AccessDeniedError,
        );
      }
      for (const data of [
        { name: " " },
        { name: "a".repeat(121) },
        { name: "Categoria", id: randomUUID() },
      ])
        await assert.rejects(
          createCategory(database, fixtures.manager.id, data),
          z.ZodError,
        );
    });

    it("rejects case/whitespace duplicate categories atomically under concurrent submissions", async () => {
      const name = `Duplicidade QA ${randomUUID()}`;
      const results = await Promise.allSettled([
        createCategory(database, fixtures.manager.id, { name }),
        createCategory(database, fixtures.manager.id, {
          name: ` ${name.toUpperCase().replace(" ", "  ")} `,
        }),
      ]);
      assert.equal(
        results.filter((result) => result.status === "fulfilled").length,
        1,
      );
      const failure = results.find(
        (result) => result.status === "rejected",
      ) as PromiseRejectedResult;
      assert.ok(
        failure.reason instanceof ManagementError &&
          failure.reason.code === "categoria-duplicada",
      );
    });

    it("rejects visitors and managers in every quote operation", async () => {
      for (const actorId of ["", fixtures.manager.id]) {
        for (const operation of [
          () => createQuote(database, actorId, input()),
          () => reviseQuote(database, actorId, randomUUID(), input()),
          () => getQuoteWorkspace(database, actorId),
          () => getQuoteHistory(database, actorId, randomUUID()),
        ])
          await assert.rejects(operation(), AccessDeniedError);
      }
    });

    it("stores exact BRL/arroba values, derives company/region/author, and returns a safe DTO", async () => {
      const created = await createQuote(
        database,
        fixtures.users[0].id,
        input(),
      );
      const stored = await database.quote.findUniqueOrThrow({
        where: { id: created.id },
      });
      assert.equal(stored.pricePerArroba.toFixed(2), "301.27");
      assert.equal(stored.slaughterhouseId, fixtures.slaughterhouses[0].id);
      assert.equal(stored.regionId, fixtures.slaughterhouses[0].regionId);
      assert.equal(stored.createdById, fixtures.users[0].id);
      assert.equal(
        stored.referenceDate.toISOString(),
        "2026-10-26T00:00:00.000Z",
      );
      assert.equal(stored.version, 1);
      assert.equal(stored.previousQuoteId, null);
      const history = await getQuoteHistory(
        database,
        fixtures.users[0].id,
        created.seriesId,
      );
      assert.equal(history.current.pricePerArroba, "301.27");
      assert.deepEqual(Object.keys(history.current).sort(), [
        "category",
        "categoryId",
        "createdAt",
        "createdBy",
        "id",
        "pricePerArroba",
        "referenceDate",
        "region",
        "seriesId",
        "version",
      ]);
    });

    it("accepts the exact numeric boundary and one cent without floating-point rounding", async () => {
      for (const [value, expected] of [
        ["9999999999.99", "9999999999.99"],
        ["0,01", "0.01"],
        ["301", "301.00"],
      ]) {
        const quote = await createQuote(
          database,
          fixtures.users[0].id,
          input({ pricePerArroba: value }),
        );
        assert.equal(
          (
            await getQuoteHistory(
              database,
              fixtures.users[0].id,
              quote.seriesId,
            )
          ).current.pricePerArroba,
          expected,
        );
      }
      assert.equal(formatPrice("9999999999.99"), "R$ 9.999.999.999,99/@");
      assert.equal(formatPrice("0.01"), "R$ 0,01/@");
    });

    it("rejects nonpositive, ambiguous, excessive and malformed prices without writing", async () => {
      const count = await database.quote.count();
      for (const pricePerArroba of [
        "0",
        "0.00",
        "0,00",
        "-1.00",
        "1.234",
        "1,234.56",
        "1.234,56",
        "1e3",
        "NaN",
        "Infinity",
        "10000000000.00",
        "",
        "1.",
        null,
      ])
        await assert.rejects(
          createQuote(
            database,
            fixtures.users[0].id,
            input({ pricePerArroba }),
          ),
          z.ZodError,
        );
      assert.equal(await database.quote.count(), count);
    });

    it("validates calendar dates and preserves civil dates independently of timezone", async () => {
      for (const referenceDate of [
        "2025-02-29",
        "2026-02-30",
        "26/10/2026",
        "0000-01-01",
        "2026-13-01",
        "2026-10-26T12:00:00Z",
      ])
        await assert.rejects(
          createQuote(database, fixtures.users[0].id, input({ referenceDate })),
          z.ZodError,
        );
      const quote = await createQuote(
        database,
        fixtures.users[0].id,
        input({ referenceDate: "2024-02-29" }),
      );
      assert.equal(
        (await getQuoteHistory(database, fixtures.users[0].id, quote.seriesId))
          .current.referenceDate,
        "2024-02-29",
      );
      assert.equal(formatReferenceDate("2024-02-29"), "29/02/2024");
      assert.equal(
        todayInBahia(new Date("2026-10-27T01:00:00.000Z")),
        "2026-10-26",
      );
    });

    it("rejects forged company, region, author, version and series fields", async () => {
      for (const field of [
        "slaughterhouseId",
        "regionId",
        "createdById",
        "version",
        "seriesId",
        "previousQuoteId",
      ])
        await assert.rejects(
          createQuote(
            database,
            fixtures.users[0].id,
            input({ [field]: randomUUID() }),
          ),
          z.ZodError,
        );
      await assert.rejects(
        createQuote(
          database,
          fixtures.users[0].id,
          input({ categoryId: randomUUID() }),
        ),
        quoteError("categoria"),
      );
      await assert.rejects(
        createQuote(
          database,
          fixtures.users[0].id,
          input({ categoryId: "invalid" }),
        ),
        z.ZodError,
      );
    });

    it("isolates listings/history and makes a foreign quote indistinguishable from an absent one", async () => {
      const foreign = await createQuote(
        database,
        fixtures.users[1].id,
        input({ pricePerArroba: "9417,83" }),
      );
      const workspace = await getQuoteWorkspace(database, fixtures.users[0].id);
      assert.ok(
        !workspace.items.some((item) => item.seriesId === foreign.seriesId),
      );
      assert.ok(!JSON.stringify(workspace).includes("9417.83"));
      await assert.rejects(
        getQuoteHistory(database, fixtures.users[0].id, foreign.seriesId),
        quoteError("nao-encontrada"),
      );
      await assert.rejects(
        getQuoteHistory(database, fixtures.users[0].id, randomUUID()),
        quoteError("nao-encontrada"),
      );
      await assert.rejects(
        reviseQuote(database, fixtures.users[0].id, foreign.id, input()),
        quoteError("nao-encontrada"),
      );
      assert.equal(
        (
          await getQuoteHistory(
            database,
            fixtures.users[1].id,
            foreign.seriesId,
          )
        ).current.pricePerArroba,
        "9417.83",
      );
    });

    it("appends a revision with corrected price/category/date while preserving the original row", async () => {
      const quote = await createQuote(database, fixtures.users[0].id, input());
      const before = await database.quote.findUniqueOrThrow({
        where: { id: quote.id },
      });
      const category = await createCategory(database, fixtures.manager.id, {
        name: `Correção QA ${randomUUID()}`,
      });
      const updated = await reviseQuote(
        database,
        fixtures.users[0].id,
        quote.id,
        input({
          categoryId: category.id,
          pricePerArroba: "302,18",
          referenceDate: "2026-10-27",
        }),
      );
      assert.notEqual(updated.id, quote.id);
      assert.equal(updated.seriesId, quote.seriesId);
      assert.deepEqual(
        await database.quote.findUniqueOrThrow({ where: { id: quote.id } }),
        before,
      );
      const history = await getQuoteHistory(
        database,
        fixtures.users[0].id,
        quote.seriesId,
      );
      assert.deepEqual(
        history.versions.map((item) => item.version),
        [2, 1],
      );
      assert.deepEqual(
        history.versions.map((item) => item.pricePerArroba),
        ["302.18", "301.27"],
      );
      assert.equal(history.current.categoryId, category.id);
      assert.equal(history.current.referenceDate, "2026-10-27");
      const list = await getQuoteWorkspace(database, fixtures.users[0].id);
      assert.equal(
        list.items.filter((item) => item.seriesId === quote.seriesId).length,
        1,
      );
      assert.equal(
        list.items.find((item) => item.seriesId === quote.seriesId)?.version,
        2,
      );
    });

    it("rejects stale revisions instead of silently overwriting a newer price", async () => {
      const quote = await createQuote(database, fixtures.users[0].id, input());
      await reviseQuote(
        database,
        fixtures.users[0].id,
        quote.id,
        input({ pricePerArroba: "310.00" }),
      );
      await assert.rejects(
        reviseQuote(
          database,
          fixtures.users[0].id,
          quote.id,
          input({ pricePerArroba: "320.00" }),
        ),
        quoteError("atualizada"),
      );
      const history = await getQuoteHistory(
        database,
        fixtures.users[0].id,
        quote.seriesId,
      );
      assert.equal(history.total, 2);
      assert.equal(history.current.pricePerArroba, "310.00");
    });

    it("serializes simultaneous revisions and preserves one linear version history", async () => {
      const quote = await createQuote(database, fixtures.users[0].id, input());
      const results = await Promise.allSettled([
        reviseQuote(
          database,
          fixtures.users[0].id,
          quote.id,
          input({ pricePerArroba: "311.00" }),
        ),
        reviseQuote(
          database,
          coworkerId,
          quote.id,
          input({ pricePerArroba: "312.00" }),
        ),
      ]);
      assert.equal(
        results.filter((result) => result.status === "fulfilled").length,
        1,
      );
      const failure = results.find(
        (result) => result.status === "rejected",
      ) as PromiseRejectedResult;
      assert.ok(quoteError("atualizada")(failure.reason));
      assert.equal(
        (await getQuoteHistory(database, coworkerId, quote.seriesId)).total,
        2,
      );
    });

    it("lets another active account of the same company update the quote and records that author", async () => {
      const quote = await createQuote(database, fixtures.users[0].id, input());
      const revision = await reviseQuote(
        database,
        coworkerId,
        quote.id,
        input({ pricePerArroba: "333,33" }),
      );
      assert.equal(
        (await database.quote.findUniqueOrThrow({ where: { id: revision.id } }))
          .createdById,
        coworkerId,
      );
      const history = await getQuoteHistory(
        database,
        fixtures.users[0].id,
        quote.seriesId,
      );
      assert.equal(history.current.createdBy, "Colega de teste");
      assert.equal(history.versions[1].createdBy, fixtures.users[0].name);
    });

    it("preserves a series region after a company moves and uses the current region for new quotes", async () => {
      const company = fixtures.slaughterhouses[0];
      const quote = await createQuote(database, fixtures.users[0].id, input());
      const region = await createRegion(database, fixtures.manager.id, {
        name: `Nova região QA ${randomUUID()}`,
      });
      await updateSlaughterhouse(database, fixtures.manager.id, company.id, {
        name: company.name,
        regionId: region.id,
        isActive: true,
      });
      try {
        const revised = await reviseQuote(
          database,
          fixtures.users[0].id,
          quote.id,
          input({ pricePerArroba: "340" }),
        );
        const fresh = await createQuote(
          database,
          fixtures.users[0].id,
          input(),
        );
        assert.equal(
          (
            await database.quote.findUniqueOrThrow({
              where: { id: revised.id },
            })
          ).regionId,
          company.regionId,
        );
        assert.equal(
          (await database.quote.findUniqueOrThrow({ where: { id: fresh.id } }))
            .regionId,
          region.id,
        );
      } finally {
        await updateSlaughterhouse(database, fixtures.manager.id, company.id, {
          name: company.name,
          regionId: company.regionId,
          isActive: true,
        });
      }
    });

    it("denies disabled accounts and inactive companies immediately in reads and writes", async () => {
      const user = fixtures.users[0];
      const company = fixtures.slaughterhouses[0];
      const quote = await createQuote(database, user.id, input());
      await updateAccess(database, fixtures.manager.id, company.id, user.id, {
        name: user.name,
        email: user.email,
        isActive: false,
      });
      try {
        await assert.rejects(
          createQuote(database, user.id, input()),
          AccessDeniedError,
        );
        await assert.rejects(
          getQuoteHistory(database, user.id, quote.seriesId),
          AccessDeniedError,
        );
      } finally {
        await updateAccess(database, fixtures.manager.id, company.id, user.id, {
          name: user.name,
          email: user.email,
          isActive: true,
        });
      }
      await updateSlaughterhouse(database, fixtures.manager.id, company.id, {
        name: company.name,
        regionId: company.regionId,
        isActive: false,
      });
      try {
        await assert.rejects(
          reviseQuote(database, user.id, quote.id, input()),
          AccessDeniedError,
        );
        await assert.rejects(
          getQuoteWorkspace(database, user.id),
          AccessDeniedError,
        );
      } finally {
        await updateSlaughterhouse(database, fixtures.manager.id, company.id, {
          name: company.name,
          regionId: company.regionId,
          isActive: true,
        });
      }
    });

    it("paginates latest quotes and version history without returning replaced versions in the listing", async () => {
      const ids = Array.from({ length: 22 }, () => randomUUID());
      await database.quote.createMany({
        data: ids.map((id) => ({
          id,
          slaughterhouseId: fixtures.slaughterhouses[0].id,
          regionId: fixtures.slaughterhouses[0].regionId,
          categoryId,
          pricePerArroba: "401.01",
          referenceDate: new Date("2026-10-26"),
        })),
      });
      const first = await getQuoteWorkspace(database, fixtures.users[0].id, 1);
      const second = await getQuoteWorkspace(database, fixtures.users[0].id, 2);
      assert.equal(first.items.length, 20);
      assert.ok(second.items.length > 0);
      assert.ok(
        !second.items.some((item) =>
          first.items.some((previous) => previous.id === item.id),
        ),
      );
      assert.equal(
        (await getQuoteWorkspace(database, fixtures.users[0].id, Number.NaN))
          .page,
        1,
      );
      const quote = await createQuote(database, fixtures.users[0].id, input());
      let previous = quote.id;
      for (let index = 0; index < 21; index++)
        previous = (
          await reviseQuote(
            database,
            fixtures.users[0].id,
            previous,
            input({ pricePerArroba: String(500 + index) }),
          )
        ).id;
      const history = await getQuoteHistory(
        database,
        fixtures.users[0].id,
        quote.seriesId,
      );
      const last = await getQuoteHistory(
        database,
        fixtures.users[0].id,
        quote.seriesId,
        2,
      );
      assert.equal(history.versions.length, 20);
      assert.equal(last.versions.length, 2);
      assert.equal(history.current.version, 22);
      assert.deepEqual(
        last.versions.map((item) => item.version),
        [2, 1],
      );
    });

    it("shares the quote-write limit across company accounts while keeping other companies independent", async () => {
      const now = Date.now();
      const results = await Promise.all(
        Array.from({ length: 40 }, (_, index) =>
          consumeQuoteRateLimit(
            database,
            index % 2 ? fixtures.users[0].id : coworkerId,
            now,
          ),
        ),
      );
      assert.equal(results.filter(Boolean).length, 30);
      assert.equal(
        await consumeQuoteRateLimit(database, fixtures.users[1].id, now),
        true,
      );
      assert.equal(
        await consumeQuoteRateLimit(
          database,
          fixtures.users[0].id,
          now + 59_999,
        ),
        false,
      );
      assert.equal(
        await consumeQuoteRateLimit(
          database,
          fixtures.users[0].id,
          now + 60_000,
        ),
        true,
      );
    });

    it("does not invent authorship for a legacy record", async () => {
      const quote = await database.quote.create({
        data: {
          slaughterhouseId: fixtures.slaughterhouses[0].id,
          regionId: fixtures.slaughterhouses[0].regionId,
          categoryId,
          pricePerArroba: "301.27",
          referenceDate: new Date("2026-10-26"),
        },
      });
      const history = await getQuoteHistory(
        database,
        fixtures.users[0].id,
        quote.seriesId,
      );
      assert.equal(history.current.createdBy, "Autoria não registrada");
    });
  },
);
