import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { Prisma } from "@/generated/prisma/client";
import { getDatabase } from "@/lib/db";

import { getTestDatabaseUrl } from "./helpers/database";

const originalDatabaseUrl = process.env.DATABASE_URL;
let database: ReturnType<typeof getDatabase> | undefined;

const rollback = new Error("Rollback of isolated test fixtures");

async function withRollback(
  run: (transaction: Prisma.TransactionClient) => Promise<void>,
) {
  database ??= getDatabase();

  try {
    await database.$transaction(async (transaction) => {
      await run(transaction);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

async function createFixture(transaction: Prisma.TransactionClient) {
  const suffix = randomUUID();
  const region = await transaction.region.create({
    data: { name: `Região de teste ${suffix}` },
  });
  const category = await transaction.cattleCategory.create({
    data: { name: `Categoria de teste ${suffix}` },
  });
  const slaughterhouse = await transaction.slaughterhouse.create({
    data: { name: `Frigorífico de teste ${suffix}`, regionId: region.id },
  });

  return {
    region,
    category,
    slaughterhouse,
    quote: {
      slaughterhouseId: slaughterhouse.id,
      regionId: region.id,
      categoryId: category.id,
      pricePerArroba: new Prisma.Decimal("301.27"),
      referenceDate: new Date("2026-10-26T00:00:00.000Z"),
    },
  };
}

function hasCode(code: string) {
  return (error: unknown) =>
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === code;
}

describe("PostgreSQL / Prisma", { concurrency: false }, () => {
  before(() => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
  });

  after(async () => {
    await database?.$disconnect();
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("rejects missing or invalid configuration without exposing credentials", () => {
    const testUrl = process.env.DATABASE_URL;
    try {
      delete process.env.DATABASE_URL;
      assert.throws(() => getDatabase(), /DATABASE_URL deve ser configurada/);
      for (const value of [
        "invalid",
        "https://user:private@localhost/database",
      ]) {
        process.env.DATABASE_URL = value;
        assert.throws(() => getDatabase(), {
          message: "DATABASE_URL deve ser uma URL PostgreSQL válida.",
        });
      }
    } finally {
      process.env.DATABASE_URL = testUrl;
    }
  });

  it("persists exact decimal prices, reference dates and historical records", async () => {
    await withRollback(async (transaction) => {
      const fixture = await createFixture(transaction);
      await transaction.quote.create({ data: fixture.quote });
      await transaction.quote.create({
        data: {
          ...fixture.quote,
          pricePerArroba: new Prisma.Decimal("302.18"),
          referenceDate: new Date("2026-10-27T00:00:00.000Z"),
        },
      });

      const history = await transaction.quote.findMany({
        where: { slaughterhouseId: fixture.slaughterhouse.id },
        orderBy: { referenceDate: "asc" },
      });

      assert.deepEqual(
        history.map((quote) => quote.pricePerArroba.toFixed(2)),
        ["301.27", "302.18"],
      );
      assert.equal(
        history[0].referenceDate.toISOString(),
        "2026-10-26T00:00:00.000Z",
      );
      assert.ok(history[0].createdAt instanceof Date);
      assert.equal(fixture.slaughterhouse.isActive, true);
      assert.equal(getDatabase(), database);
    });
  });

  for (const price of ["0.00", "-1.00"]) {
    it(`rejects a nonpositive price (${price}) at the database boundary`, async () => {
      await withRollback(async (transaction) => {
        const fixture = await createFixture(transaction);
        await assert.rejects(
          transaction.quote.create({
            data: {
              ...fixture.quote,
              pricePerArroba: new Prisma.Decimal(price),
            },
          }),
          /Quote_pricePerArroba_positive/,
        );
      });
    });
  }

  it("rejects quotes belonging to nonexistent slaughterhouses", async () => {
    await withRollback(async (transaction) => {
      const fixture = await createFixture(transaction);
      await assert.rejects(
        transaction.quote.create({
          data: { ...fixture.quote, slaughterhouseId: randomUUID() },
        }),
        hasCode("P2003"),
      );
    });
  });

  it("prevents deletion of a slaughterhouse with historical quotes", async () => {
    await withRollback(async (transaction) => {
      const fixture = await createFixture(transaction);
      await transaction.quote.create({ data: fixture.quote });
      await assert.rejects(
        transaction.slaughterhouse.delete({
          where: { id: fixture.slaughterhouse.id },
        }),
        hasCode("P2003"),
      );
    });
  });

  it("preserves the recorded quote region after a slaughterhouse moves", async () => {
    await withRollback(async (transaction) => {
      const fixture = await createFixture(transaction);
      const quote = await transaction.quote.create({ data: fixture.quote });
      const nextRegion = await transaction.region.create({
        data: { name: `Outra região de teste ${randomUUID()}` },
      });
      await transaction.slaughterhouse.update({
        where: { id: fixture.slaughterhouse.id },
        data: { regionId: nextRegion.id, isActive: false },
      });
      const preserved = await transaction.quote.findUniqueOrThrow({
        where: { id: quote.id },
      });
      assert.equal(preserved.regionId, fixture.region.id);
      assert.equal(preserved.pricePerArroba.toFixed(2), "301.27");
    });
  });

  it("rejects duplicate region names", async () => {
    await withRollback(async (transaction) => {
      const fixture = await createFixture(transaction);
      await assert.rejects(
        transaction.region.create({ data: { name: fixture.region.name } }),
        hasCode("P2002"),
      );
    });
  });
});
