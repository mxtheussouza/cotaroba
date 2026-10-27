import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import {
  getQuoteTrend,
  listChartSlaughterhouses,
} from "@/features/dashboard/quote-service";
import { getDashboard } from "@/features/dashboard/service";
import { createQuote, reviseQuote } from "@/features/quotes/service";
import {
  createCategory,
  createRegion,
  updateSlaughterhouse,
} from "@/features/slaughterhouses/service";
import { getDatabase } from "@/lib/db";

import { createAuthFixtures } from "./helpers/auth-fixtures";
import { getTestDatabaseUrl } from "./helpers/database";

const originalUrl = process.env.DATABASE_URL;
let db: ReturnType<typeof getDatabase>;
let fixtures: Awaited<ReturnType<typeof createAuthFixtures>>;
const now = new Date("2026-10-27T15:00:00Z");
async function category() {
  return (
    await createCategory(db, fixtures.manager.id, {
      name: `Categoria painel ${randomUUID()}`,
    })
  ).id;
}
function filters(categoryId: string) {
  return {
    slaughterhouseId: fixtures.slaughterhouses[0].id,
    regionId: fixtures.slaughterhouses[0].regionId,
    categoryId,
    start: "2026-10-01",
    end: "2026-10-27",
  };
}
function input(
  categoryId: string,
  pricePerArroba: string,
  referenceDate = "2026-10-26",
) {
  return { categoryId, pricePerArroba, referenceDate };
}

describe(
  "Public slaughterhouse daily evolution",
  { concurrency: false },
  () => {
    before(async () => {
      process.env.DATABASE_URL = getTestDatabaseUrl();
      db = getDatabase();
      fixtures = await createAuthFixtures(db);
    });
    after(async () => {
      await fixtures?.cleanup();
      await db?.$disconnect();
      if (originalUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalUrl;
    });

    it("returns empty data for a valid selection without inventing a trend", async () => {
      const trend = await getQuoteTrend(db, filters(await category()));
      assert.deepEqual(trend?.points, []);
      assert.equal(trend?.variation, null);
    });

    it("publishes distinct dates without averages and hides all superseded corrections and private metadata", async () => {
      const selected = await category();
      await createQuote(
        db,
        fixtures.users[0].id,
        input(selected, "300", "2026-10-20"),
      );
      const old = await createQuote(
        db,
        fixtures.users[0].id,
        input(selected, "315", "2026-10-26"),
      );
      await reviseQuote(
        db,
        fixtures.users[0].id,
        old.id,
        input(selected, "330", "2026-10-26"),
      );
      await createQuote(
        db,
        fixtures.users[1].id,
        input(selected, "999", "2026-10-26"),
      );
      await createQuote(
        db,
        fixtures.users[0].id,
        input(selected, "888", "2026-09-30"),
      );
      const trend = (await getQuoteTrend(db, filters(selected)))!;
      assert.deepEqual(
        trend.points.map(({ date, value }) => [date, value]),
        [
          ["2026-10-20", "300.00"],
          ["2026-10-26", "330.00"],
        ],
      );
      assert.equal(trend.variation?.percent, "10.00");
      assert.deepEqual(Object.keys(trend.points[0]).sort(), [
        "date",
        "updatedAt",
        "value",
      ]);
      for (const secret of [
        old.id,
        old.seriesId,
        fixtures.users[0].id,
        fixtures.users[0].email,
        "315.00",
        "999.00",
        "888.00",
      ])
        assert.ok(!JSON.stringify(trend).includes(secret));
    });

    it("selects one latest current quote per date when independent series share that date", async () => {
      const selected = await category();
      const first = await createQuote(
        db,
        fixtures.users[0].id,
        input(selected, "300"),
      );
      const second = await createQuote(
        db,
        fixtures.users[0].id,
        input(selected, "310"),
      );
      await db.quote.update({
        where: { id: first.id },
        data: { createdAt: new Date("2026-10-26T10:00:00Z") },
      });
      await db.quote.update({
        where: { id: second.id },
        data: { createdAt: new Date("2026-10-26T11:00:00Z") },
      });
      const trend = await getQuoteTrend(db, filters(selected));
      assert.equal(trend?.points.length, 1);
      assert.equal(trend?.points[0].value, "310.00");
      assert.equal(trend?.variation, null);
    });

    it("does not reveal a superseded record when a correction changes its date or category", async () => {
      const selected = await category();
      const other = await category();
      const old = await createQuote(
        db,
        fixtures.users[0].id,
        input(selected, "444", "2026-10-20"),
      );
      await reviseQuote(
        db,
        fixtures.users[0].id,
        old.id,
        input(other, "450", "2026-10-26"),
      );
      assert.deepEqual(
        (await getQuoteTrend(db, filters(selected)))?.points,
        [],
      );
      assert.deepEqual(
        (await getQuoteTrend(db, filters(other)))?.points.map(
          ({ date, value }) => [date, value],
        ),
        [["2026-10-26", "450.00"]],
      );
    });

    it("excludes inactive slaughterhouses and references from their former region", async () => {
      const selected = await category();
      const company = fixtures.slaughterhouses[0];
      await createQuote(db, fixtures.users[0].id, input(selected, "300"));
      const region = await createRegion(db, fixtures.manager.id, {
        name: `Região painel ${randomUUID()}`,
      });
      try {
        await updateSlaughterhouse(db, fixtures.manager.id, company.id, {
          name: company.name,
          regionId: region.id,
          isActive: true,
        });
        assert.equal(await getQuoteTrend(db, filters(selected)), null);
        assert.deepEqual(
          (
            await getQuoteTrend(db, {
              ...filters(selected),
              regionId: region.id,
            })
          )?.points,
          [],
        );
        await updateSlaughterhouse(db, fixtures.manager.id, company.id, {
          name: company.name,
          regionId: region.id,
          isActive: false,
        });
        assert.equal(
          await getQuoteTrend(db, {
            ...filters(selected),
            regionId: region.id,
          }),
          null,
        );
        assert.deepEqual(await listChartSlaughterhouses(db, region.id), []);
      } finally {
        await updateSlaughterhouse(db, fixtures.manager.id, company.id, {
          name: company.name,
          regionId: company.regionId,
          isActive: true,
        });
      }
    });

    it("rejects invalid IDs, unrelated region/category and excessive/reversed windows", async () => {
      const selected = await category();
      const valid = filters(selected);
      for (const patch of [
        { slaughterhouseId: "invalid" },
        { categoryId: "" },
        { regionId: randomUUID() },
        { categoryId: randomUUID() },
        { start: "2026-10-27", end: "2026-10-01" },
        { start: "2020-01-01" },
      ])
        assert.equal(await getQuoteTrend(db, { ...valid, ...patch }), null);
      assert.deepEqual(await listChartSlaughterhouses(db, "invalid"), []);
    });

    it("compares current individual quotes from two regions without averaging or mixing companies", async () => {
      const selected = await category();
      const company = fixtures.slaughterhouses[1];
      const region = await createRegion(db, fixtures.manager.id, {
        name: `Comparação painel ${randomUUID()}`,
      });
      try {
        await createQuote(
          db,
          fixtures.users[0].id,
          input(selected, "301", "2026-10-20"),
        );
        await updateSlaughterhouse(db, fixtures.manager.id, company.id, {
          name: company.name,
          regionId: region.id,
          isActive: true,
        });
        await createQuote(
          db,
          fixtures.users[1].id,
          input(selected, "321", "2026-10-26"),
        );
        const board = await getDashboard(
          db,
          {
            regiao: fixtures.slaughterhouses[0].regionId,
            categoria: selected,
            comparar: region.id,
          },
          now,
        );
        assert.deepEqual(
          board.quotes.items.map((row) => row.pricePerArroba),
          ["301.00"],
        );
        assert.deepEqual(
          board.comparison?.items.map((row) => row.pricePerArroba),
          ["321.00"],
        );
        assert.equal(board.comparisonRegion?.id, region.id);
        assert.equal(
          board.quotes.items[0].slaughterhouse,
          fixtures.slaughterhouses[0].name,
        );
        assert.equal(board.comparison?.items[0].slaughterhouse, company.name);
      } finally {
        await updateSlaughterhouse(db, fixtures.manager.id, company.id, {
          name: company.name,
          regionId: company.regionId,
          isActive: true,
        });
      }
    });

    it("keeps dashboard invalid filters safe and requires one category for a local trend", async () => {
      const board = await getDashboard(
        db,
        {
          regiao: "unknown",
          categoria: "unknown",
          frigorifico: "unknown",
          serie: "unknown",
          inicio: "invalid",
          fim: "2026-10-27",
          arroba: randomUUID(),
          bezerro: randomUUID(),
        },
        now,
      );
      assert.ok(board.period.error);
      assert.equal(board.quotes.categoryId, "");
      assert.equal(board.quoteTrend, null);
      assert.equal(board.ratio, null);
      assert.equal(board.quotes.region?.id, board.quotes.regions[0]?.id);
    });
  },
);
