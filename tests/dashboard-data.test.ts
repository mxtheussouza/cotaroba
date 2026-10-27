import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import {
  getExternalTrend,
  listExternalChartSources,
} from "@/features/dashboard/external-service";
import {
  createManualSeries,
  saveManualObservation,
} from "@/features/external-data/service";
import { getDatabase } from "@/lib/db";

import { createAuthFixtures } from "./helpers/auth-fixtures";
import { getTestDatabaseUrl } from "./helpers/database";

const now = new Date("2026-10-27T15:00:00Z");
const period = { start: "2026-10-01", end: "2026-10-27" };
const originalUrl = process.env.DATABASE_URL;
let db: ReturnType<typeof getDatabase>;
let fixtures: Awaited<ReturnType<typeof createAuthFixtures>>;
const seriesIds: string[] = [];

async function series(overrides: Record<string, unknown> = {}) {
  const row = await createManualSeries(db, fixtures.manager.id, {
    name: `Série do painel ${randomUUID()}`,
    metric: "RAINFALL",
    frequency: "DAILY",
    geography: "Localidade sintética",
    sourceName: "Fonte sintética",
    sourceUrl: "https://example.invalid/test",
    staleAfterDays: "7",
    ...overrides,
  });
  seriesIds.push(row.id);
  return row.id;
}
async function save(
  id: string,
  date: string,
  value: string,
  overrides: Record<string, unknown> = {},
) {
  await saveManualObservation(
    db,
    fixtures.manager.id,
    id,
    { periodStart: date, periodEnd: date, value, validUntil: "", ...overrides },
    now,
  );
}

describe("Dashboard external trend persistence", { concurrency: false }, () => {
  before(async () => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    db = getDatabase();
    fixtures = await createAuthFixtures(db);
  });
  after(async () => {
    if (db) {
      await db.externalObservation.deleteMany({
        where: { seriesId: { in: seriesIds } },
      });
      await db.externalSeries.deleteMany({ where: { id: { in: seriesIds } } });
    }
    await fixtures?.cleanup();
    await db?.$disconnect();
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
  });

  it("keeps an empty series empty, with its source and unit", async () => {
    const id = await series();
    const trend = await getExternalTrend(db, id, period, now);
    assert.deepEqual(trend?.points, []);
    assert.equal(trend?.variation, null);
    assert.equal(trend?.freshness, "missing");
    assert.equal(trend?.unit, "mm");
    assert.ok(
      (await listExternalChartSources(db)).some((row) => row.id === id),
    );
  });

  it("selects only the latest revision per period and excludes points outside the range", async () => {
    const id = await series();
    await save(id, "2026-09-30", "999");
    await save(id, "2026-10-01", "10");
    await save(id, "2026-10-26", "15");
    await save(id, "2026-10-26", "20");
    const trend = (await getExternalTrend(db, id, period, now))!;
    assert.deepEqual(
      trend.points.map(({ date, value }) => [date, value]),
      [
        ["2026-10-01", "10.0000"],
        ["2026-10-26", "20.0000"],
      ],
    );
    assert.equal(trend.variation?.percent, "100.00");
    assert.deepEqual(Object.keys(trend.points[0]).sort(), [
      "collectedAt",
      "date",
      "origin",
      "periodStart",
      "validUntil",
      "value",
    ]);
    const serialized = JSON.stringify(trend);
    for (const secret of [
      fixtures.manager.id,
      fixtures.manager.name,
      fixtures.manager.email,
      "createdBy",
      "revision",
      "999.0000",
      "15.0000",
    ])
      assert.ok(!serialized.includes(secret));
  });

  it("does not invent a trend from one point or a percentage from a zero baseline", async () => {
    const id = await series();
    await save(id, "2026-10-01", "0");
    assert.equal(
      (await getExternalTrend(db, id, period, now))?.variation,
      null,
    );
    await save(id, "2026-10-26", "5");
    assert.deepEqual((await getExternalTrend(db, id, period, now))?.variation, {
      absolute: "5.0000",
      percent: null,
    });
  });

  it("retains full quarterly periods and filters by their ending reference date", async () => {
    const id = await series({
      metric: "CATTLE_SLAUGHTER",
      frequency: "QUARTERLY",
      staleAfterDays: "180",
    });
    await save(id, "2026-04-01", "123", { periodEnd: "2026-06-30" });
    assert.equal(
      (await getExternalTrend(db, id, period, now))?.points.length,
      0,
    );
    const trend = await getExternalTrend(
      db,
      id,
      { start: "2026-06-01", end: "2026-06-30" },
      now,
    );
    assert.equal(trend?.points[0].periodStart, "2026-04-01");
    assert.equal(trend?.points[0].date, "2026-06-30");
    assert.equal(trend?.unit, "cabeças");
  });

  it("marks old or expired references even when their correction was collected recently", async () => {
    const id = await series();
    await save(id, "2026-10-01", "1");
    await save(id, "2026-10-01", "2");
    assert.equal(
      (await getExternalTrend(db, id, period, now))?.freshness,
      "stale",
    );
    await save(id, "2026-10-26", "3", { validUntil: "2026-10-26" });
    assert.equal(
      (await getExternalTrend(db, id, period, now))?.freshness,
      "expired",
    );
  });

  it("rejects unknown IDs and reversed or excessive windows without broadening access", async () => {
    assert.equal(await getExternalTrend(db, "invalid", period, now), null);
    assert.equal(await getExternalTrend(db, randomUUID(), period, now), null);
    const id = await series();
    assert.equal(
      await getExternalTrend(
        db,
        id,
        { start: "2026-10-27", end: "2026-10-01" },
        now,
      ),
      null,
    );
    assert.equal(
      await getExternalTrend(
        db,
        id,
        { start: "2020-01-01", end: "2026-10-27" },
        now,
      ),
      null,
    );
  });
});
