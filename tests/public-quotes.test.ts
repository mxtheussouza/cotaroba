import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { createQuote, reviseQuote } from "@/features/quotes/service";
import { getPublicQuotes } from "@/features/public-quotes/service";
import {
  createCategory,
  createRegion,
  updateSlaughterhouse,
} from "@/features/slaughterhouses/service";
import { getDatabase } from "@/lib/db";

import { createAuthFixtures } from "./helpers/auth-fixtures";
import { getTestDatabaseUrl } from "./helpers/database";

const originalUrl = process.env.DATABASE_URL;
let database: ReturnType<typeof getDatabase>;
let fixtures: Awaited<ReturnType<typeof createAuthFixtures>>;

async function category() {
  return createCategory(database, fixtures.manager.id, {
    name: `Categoria pública ${randomUUID()}`,
  });
}

function input(
  categoryId: string,
  pricePerArroba: string,
  referenceDate = "2026-10-26",
) {
  return { categoryId, pricePerArroba, referenceDate };
}

describe("Public slaughterhouse quotes", { concurrency: false }, () => {
  before(async () => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    database = getDatabase();
    fixtures = await createAuthFixtures(database);
  });
  after(async () => {
    await fixtures?.cleanup();
    await database?.$disconnect();
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
  });

  it("shows Dados insuficientes when the selected region has no current quote", async () => {
    const board = await getPublicQuotes(database, {
      regionId: fixtures.slaughterhouses[0].regionId,
    });
    assert.equal(board.total, 0);
    assert.deepEqual(board.items, []);
    assert.equal(board.region?.id, fixtures.slaughterhouses[0].regionId);
  });

  it("publishes one company's exact price and name without private quote metadata", async () => {
    const selected = await category();
    await createQuote(
      database,
      fixtures.users[0].id,
      input(selected.id, "301,27"),
    );
    const board = await getPublicQuotes(database, {
      regionId: fixtures.slaughterhouses[0].regionId,
      categoryId: selected.id,
    });
    assert.equal(board.total, 1);
    assert.deepEqual(board.items[0] && Object.keys(board.items[0]).sort(), [
      "category",
      "pricePerArroba",
      "referenceDate",
      "slaughterhouse",
      "updatedAt",
    ]);
    assert.equal(
      board.items[0].slaughterhouse,
      fixtures.slaughterhouses[0].name,
    );
    assert.equal(board.items[0].pricePerArroba, "301.27");
    assert.equal(
      board.items[0].category,
      board.categories.find((item) => item.id === selected.id)?.name,
    );
    assert.equal(board.items[0].referenceDate, "2026-10-26");
    assert.ok(!JSON.stringify(board.items).includes(fixtures.users[0].email));
  });

  it("publishes each company's latest current quote rather than an average or old version", async () => {
    const selected = await category();
    const first = await createQuote(
      database,
      fixtures.users[0].id,
      input(selected.id, "300.00"),
    );
    await createQuote(
      database,
      fixtures.users[1].id,
      input(selected.id, "320.00"),
    );
    await reviseQuote(
      database,
      fixtures.users[0].id,
      first.id,
      input(selected.id, "305.00", "2026-10-27"),
    );
    await createQuote(
      database,
      fixtures.users[0].id,
      input(selected.id, "290.00", "2026-10-25"),
    );
    const board = await getPublicQuotes(database, {
      regionId: fixtures.slaughterhouses[0].regionId,
      categoryId: selected.id,
    });
    assert.equal(board.total, 2);
    assert.deepEqual(
      board.items.map(({ pricePerArroba }) => pricePerArroba).sort(),
      ["305.00", "320.00"],
    );
    assert.equal(
      new Set(board.items.map(({ slaughterhouse }) => slaughterhouse)).size,
      2,
    );
    assert.ok(!JSON.stringify(board.items).includes("300.00"));
  });

  it("hides inactive companies and prices from a company's former region", async () => {
    const selected = await category();
    const company = fixtures.slaughterhouses[0];
    await createQuote(
      database,
      fixtures.users[0].id,
      input(selected.id, "411.00"),
    );
    const region = await createRegion(database, fixtures.manager.id, {
      name: `Nova região pública ${randomUUID()}`,
    });
    await updateSlaughterhouse(database, fixtures.manager.id, company.id, {
      name: company.name,
      regionId: region.id,
      isActive: true,
    });
    try {
      assert.equal(
        (
          await getPublicQuotes(database, {
            regionId: company.regionId,
            categoryId: selected.id,
          })
        ).total,
        0,
      );
      await createQuote(
        database,
        fixtures.users[0].id,
        input(selected.id, "412.00"),
      );
      assert.equal(
        (
          await getPublicQuotes(database, {
            regionId: region.id,
            categoryId: selected.id,
          })
        ).items[0]?.pricePerArroba,
        "412.00",
      );
      await updateSlaughterhouse(database, fixtures.manager.id, company.id, {
        name: company.name,
        regionId: region.id,
        isActive: false,
      });
      assert.equal(
        (
          await getPublicQuotes(database, {
            regionId: region.id,
            categoryId: selected.id,
          })
        ).total,
        0,
      );
    } finally {
      await updateSlaughterhouse(database, fixtures.manager.id, company.id, {
        name: company.name,
        regionId: company.regionId,
        isActive: true,
      });
    }
  });

  it("ignores unknown filters and bounds invalid page numbers", async () => {
    const board = await getPublicQuotes(database, {
      regionId: "invalid",
      categoryId: "invalid",
      page: Number.POSITIVE_INFINITY,
    });
    assert.equal(board.region?.id, board.regions[0]?.id);
    assert.equal(board.categoryId, "");
    assert.equal(board.page, 1);
  });
});
