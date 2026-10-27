import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { AccessDeniedError } from "@/features/auth/authorization";
import {
  collectSource,
  parseIbge,
  parsePtax,
  SourceError,
  type FetchSource,
} from "@/features/external-data/connectors";
import {
  observationSchema,
  seriesSchema,
} from "@/features/external-data/schema";
import {
  createManualSeries,
  ExternalDataError,
  getExternalHistory,
  listManagerExternalData,
  listPublicExternalData,
  observationFreshness,
  saveManualObservation,
  synchronizeSource,
} from "@/features/external-data/service";
import { getDatabase } from "@/lib/db";

import { createAuthFixtures } from "./helpers/auth-fixtures";
import { getTestDatabaseUrl } from "./helpers/database";

const now = new Date("2026-10-27T15:00:00Z");
const ptax = (value = 5.5007) => ({
  value: [
    { cotacaoVenda: value, dataHoraCotacao: "2026-10-26 13:09:51.106105" },
  ],
});
const ibge = (serie: Record<string, string> = { "202602": "389905" }) => [
  {
    id: "284",
    unidade: "Cabeças",
    resultados: [
      {
        classificacoes: [
          { id: "12716", categoria: { "115236": "Total do trimestre" } },
          { id: "18", categoria: { "992": "Total" } },
          { id: "12529", categoria: { "118225": "Total" } },
        ],
        series: [{ localidade: { id: "29", nivel: { id: "N3" } }, serie }],
      },
    ],
  },
];
const response =
  (body: unknown): FetchSource =>
  async () =>
    Response.json(body);
const originalUrl = process.env.DATABASE_URL;
let db: ReturnType<typeof getDatabase>;
let fixtures: Awaited<ReturnType<typeof createAuthFixtures>>;
let ownsExternalFixtures = false;
const seriesIds: string[] = [];
let tick = 0;
const nextTime = () => new Date(now.getTime() + ++tick * 61_000);

function seriesInput(overrides: Record<string, unknown> = {}) {
  return {
    name: `Manual ${randomUUID()}`,
    metric: "RAINFALL",
    frequency: "DAILY",
    geography: "Localidade de teste",
    sourceName: "Fonte sintética de teste",
    sourceUrl: "https://example.invalid/fonte",
    staleAfterDays: "7",
    ...overrides,
  };
}
function observation(
  value = "12,3456",
  overrides: Record<string, unknown> = {},
) {
  return {
    periodStart: "2026-10-26",
    periodEnd: "2026-10-26",
    value,
    validUntil: "",
    ...overrides,
  };
}
async function createSeries(overrides: Record<string, unknown> = {}) {
  const result = await createManualSeries(
    db,
    fixtures.manager.id,
    seriesInput(overrides),
  );
  seriesIds.push(result.id);
  return result.id;
}
const code = (expected: string) => (error: unknown) =>
  error instanceof ExternalDataError && error.code === expected;

describe(
  "External data connectors and persistence",
  { concurrency: false },
  () => {
    before(async () => {
      process.env.DATABASE_URL = getTestDatabaseUrl();
      db = getDatabase();
      assert.equal(
        await db.externalSeries.count(),
        0,
        "A suíte exige tabelas externas vazias no banco isolado de testes.",
      );
      assert.equal(await db.externalSync.count(), 0);
      ownsExternalFixtures = true;
      fixtures = await createAuthFixtures(db);
    });
    after(async () => {
      if (db && ownsExternalFixtures) {
        const api = await db.externalSeries.findMany({
          where: { connector: { in: ["BCB_PTAX", "IBGE_SLAUGHTER_BA"] } },
          select: { id: true },
        });
        const ids = [...seriesIds, ...api.map((row) => row.id)];
        await db.externalObservation.deleteMany({
          where: { seriesId: { in: ids } },
        });
        await db.externalSeries.deleteMany({ where: { id: { in: ids } } });
        await db.externalSync.deleteMany({
          where: { connector: { in: ["BCB_PTAX", "IBGE_SLAUGHTER_BA"] } },
        });
      }
      await fixtures?.cleanup();
      await db?.$disconnect();
      if (originalUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalUrl;
    });

    it("normalizes PTAX sale to four decimal places and keeps its civil reference date", () => {
      assert.deepEqual(parsePtax(ptax(), "2026-10-27"), [
        observation("5.5007"),
      ]);
      for (const payload of [
        ptax(-1),
        ptax(5.123456),
        ptax(5.00000000001),
        {
          value: [{ cotacaoVenda: 5, dataHoraCotacao: "2026-02-30 13:00:00" }],
        },
        {
          value: [{ cotacaoVenda: 5, dataHoraCotacao: "2026-10-28 13:00:00" }],
        },
      ])
        assert.throws(() => parsePtax(payload, "2026-10-27"), SourceError);
    });

    it("keeps IBGE quarterly periods, totals and Bahia scope distinct from monthly/national data", () => {
      assert.deepEqual(parseIbge(ibge(), "2026-10-27"), [
        observation("389905", {
          periodStart: "2026-04-01",
          periodEnd: "2026-06-30",
        }),
      ]);
      const wrong = ibge();
      wrong[0].resultados[0].classificacoes[0].categoria = {
        "115233": "No primeiro mês",
      } as never;
      assert.throws(() => parseIbge(wrong, "2026-10-27"), SourceError);
      assert.throws(
        () =>
          parseIbge(
            JSON.parse(JSON.stringify(ibge()).replace('"29"', '"1"')),
            "2026-10-27",
          ),
        SourceError,
      );
      assert.throws(
        () => parseIbge(ibge({ "202605": "3" }), "2026-10-27"),
        SourceError,
      );
      assert.throws(
        () => parseIbge(ibge({ "202604": "3" }), "2026-10-27"),
        SourceError,
      );
    });

    it("does not turn suppressed, unavailable or nonnumeric IBGE values into zero", () => {
      assert.deepEqual(
        parseIbge(
          ibge({
            "202501": "X",
            "202502": "...",
            "202503": "-",
            "202504": "..",
          }),
          "2026-10-27",
        ),
        [],
      );
      assert.throws(
        () => parseIbge(ibge({ "202602": "unknown" }), "2026-10-27"),
        SourceError,
      );
    });

    it("fetches only fixed official endpoints with a timeout, no redirects and no public cache", async () => {
      await collectSource("BCB_PTAX", now, async (input, init) => {
        const url = new URL(String(input));
        assert.equal(url.hostname, "olinda.bcb.gov.br");
        assert.equal(url.searchParams.get("@dataInicial"), "'10-13-2026'");
        assert.equal(url.searchParams.get("@dataFinalCotacao"), "'10-27-2026'");
        assert.equal(init?.redirect, "error");
        assert.equal(init?.cache, "no-store");
        assert.ok(init?.signal);
        return Response.json(ptax());
      });
      await collectSource("IBGE_SLAUGHTER_BA", now, async (input) => {
        assert.equal(
          new URL(String(input)).hostname,
          "servicodados.ibge.gov.br",
        );
        return Response.json(ibge());
      });
    });

    it("rejects HTTP/network errors, oversized bodies, malformed JSON and empty results", async () => {
      const cases: FetchSource[] = [
        async () => new Response("unavailable", { status: 503 }),
        async () => {
          throw new DOMException("timeout", "TimeoutError");
        },
        async () => new Response("x".repeat(256_001)),
        async () => new Response("not json"),
        response({ value: [] }),
      ];
      for (const fetchSource of cases)
        await assert.rejects(
          collectSource("BCB_PTAX", now, fetchSource),
          SourceError,
        );
    });

    it("validates URLs, units, precision and civil dates at input boundaries", () => {
      for (const sourceUrl of [
        "javascript:alert(1)",
        "http://example.invalid",
        "https://user:secret@example.invalid",
      ])
        assert.equal(
          seriesSchema.safeParse(seriesInput({ sourceUrl })).success,
          false,
        );
      for (const value of ["-1", "1.000,00", "1e4", "NaN", "2.12345"])
        assert.equal(
          observationSchema.safeParse(observation(value)).success,
          false,
        );
      assert.equal(
        observationSchema.safeParse(
          observation("1", { periodStart: "2026-02-30" }),
        ).success,
        false,
      );
      assert.equal(
        observationSchema.safeParse(
          observation("1", { validUntil: "2026-10-25" }),
        ).success,
        false,
      );
      assert.equal(
        seriesSchema.safeParse(seriesInput({ metric: "UNKNOWN" })).success,
        false,
      );
    });

    it("denies visitors, slaughterhouses and inactive managers before reading/writing or fetching sources", async () => {
      let fetched = false;
      for (const actor of [null, fixtures.users[0].id]) {
        await assert.rejects(
          createManualSeries(db, actor, seriesInput()),
          AccessDeniedError,
        );
        await assert.rejects(
          listManagerExternalData(db, actor),
          AccessDeniedError,
        );
        await assert.rejects(
          getExternalHistory(db, actor, randomUUID()),
          AccessDeniedError,
        );
        await assert.rejects(
          saveManualObservation(db, actor, randomUUID(), observation()),
          AccessDeniedError,
        );
        await assert.rejects(
          synchronizeSource(db, actor, "BCB_PTAX", {
            fetchSource: async () => {
              fetched = true;
              return Response.json(ptax());
            },
          }),
          AccessDeniedError,
        );
      }
      await db.user.update({
        where: { id: fixtures.manager.id },
        data: { isActive: false },
      });
      try {
        await assert.rejects(
          createManualSeries(db, fixtures.manager.id, seriesInput()),
          AccessDeniedError,
        );
      } finally {
        await db.user.update({
          where: { id: fixtures.manager.id },
          data: { isActive: true },
        });
      }
      assert.equal(fetched, false);
    });

    it("shows missing series without fabricating a value and enforces unique series names", async () => {
      const name = `Chuva ${randomUUID()}`;
      const id = await createSeries({ name });
      await assert.rejects(
        createManualSeries(
          db,
          fixtures.manager.id,
          seriesInput({ name: name.toUpperCase() }),
        ),
        code("duplicada"),
      );
      const row = (await listPublicExternalData(db)).items.find(
        (item) => item.id === id,
      )!;
      assert.equal(row.observation, null);
      assert.equal(row.freshness, "missing");
      assert.equal(row.unit, "mm");
    });

    it("preserves manual corrections, including a return to a previous value, and skips unchanged submissions", async () => {
      const id = await createSeries();
      for (const value of ["12,3456", "15", "12.3456"])
        assert.equal(
          (
            await saveManualObservation(
              db,
              fixtures.manager.id,
              id,
              observation(value),
              now,
            )
          ).inserted,
          true,
        );
      assert.equal(
        (
          await saveManualObservation(
            db,
            fixtures.manager.id,
            id,
            observation(),
            now,
          )
        ).inserted,
        false,
      );
      const history = (await getExternalHistory(db, fixtures.manager.id, id))!;
      assert.deepEqual(
        history.rows.map((row) => row.value.toFixed(4)),
        ["12.3456", "15.0000", "12.3456"],
      );
      assert.deepEqual(
        history.rows.map((row) => row.revision),
        [3, 2, 1],
      );
      assert.ok(
        history.rows.every(
          (row) =>
            row.createdById === fixtures.manager.id && row.origin === "MANUAL",
        ),
      );
    });

    it("deduplicates simultaneous identical writes using a per-series lock", async () => {
      const id = await createSeries();
      const result = await Promise.all(
        [1, 2, 3].map(() =>
          saveManualObservation(
            db,
            fixtures.manager.id,
            id,
            observation("0"),
            now,
          ),
        ),
      );
      assert.equal(result.filter((item) => item.inserted).length, 1);
      assert.equal(
        await db.externalObservation.count({ where: { seriesId: id } }),
        1,
      );
    });

    it("rejects future references, inconsistent periods, zero prices and fractional headcounts", async () => {
      const daily = await createSeries({ metric: "CORN" });
      for (const input of [
        observation("0"),
        observation("1", { periodEnd: "2026-10-27" }),
        observation("1", {
          periodStart: "2026-10-28",
          periodEnd: "2026-10-28",
        }),
      ])
        await assert.rejects(
          saveManualObservation(db, fixtures.manager.id, daily, input, now),
          code("dados"),
        );
      const quarterly = await createSeries({
        metric: "CATTLE_SLAUGHTER",
        frequency: "QUARTERLY",
      });
      await assert.rejects(
        saveManualObservation(
          db,
          fixtures.manager.id,
          quarterly,
          observation("1.5", {
            periodStart: "2026-04-01",
            periodEnd: "2026-06-30",
          }),
          now,
        ),
        code("dados"),
      );
      await assert.rejects(
        saveManualObservation(
          db,
          fixtures.manager.id,
          quarterly,
          observation("1", {
            periodStart: "2026-04-02",
            periodEnd: "2026-06-30",
          }),
          now,
        ),
        code("dados"),
      );
      await saveManualObservation(
        db,
        fixtures.manager.id,
        quarterly,
        observation("0", {
          periodStart: "2026-04-01",
          periodEnd: "2026-06-30",
        }),
        now,
      );
    });

    it("accepts calendar months, leap days and weekly windows without inventing a daily reference", async () => {
      const monthly = await createSeries({ frequency: "MONTHLY" });
      await saveManualObservation(
        db,
        fixtures.manager.id,
        monthly,
        observation("1", {
          periodStart: "2024-02-01",
          periodEnd: "2024-02-29",
        }),
        now,
      );
      await assert.rejects(
        saveManualObservation(
          db,
          fixtures.manager.id,
          monthly,
          observation("1", {
            periodStart: "2024-02-02",
            periodEnd: "2024-02-29",
          }),
          now,
        ),
        code("dados"),
      );
      const weekly = await createSeries({ frequency: "WEEKLY" });
      await saveManualObservation(
        db,
        fixtures.manager.id,
        weekly,
        observation("1", { periodStart: "2026-10-20" }),
        now,
      );
      await assert.rejects(
        saveManualObservation(
          db,
          fixtures.manager.id,
          weekly,
          observation("1", { periodStart: "2026-10-21" }),
          now,
        ),
        code("dados"),
      );
    });

    it("publishes only the latest reference/revision without author, internal observation IDs or old values", async () => {
      const id = await createSeries();
      await saveManualObservation(
        db,
        fixtures.manager.id,
        id,
        observation("10"),
        now,
      );
      await saveManualObservation(
        db,
        fixtures.manager.id,
        id,
        observation("20"),
        now,
      );
      await saveManualObservation(
        db,
        fixtures.manager.id,
        id,
        observation("99", {
          periodStart: "2026-10-25",
          periodEnd: "2026-10-25",
        }),
        now,
      );
      const row = (await listPublicExternalData(db, 1, now)).items.find(
        (item) => item.id === id,
      )!;
      assert.equal(row.observation?.value, "20.0000");
      assert.deepEqual(Object.keys(row.observation!).sort(), [
        "collectedAt",
        "origin",
        "periodEnd",
        "periodStart",
        "validUntil",
        "value",
      ]);
      assert.ok(!JSON.stringify(row).includes(fixtures.manager.id));
      assert.ok(!JSON.stringify(row).includes(fixtures.manager.email));
    });

    it("signals defasagem from reference age rather than a recent collection and honors validity", () => {
      assert.equal(
        observationFreshness(
          { periodEnd: "2026-10-20", validUntil: null },
          7,
          now,
        ),
        "current",
      );
      assert.equal(
        observationFreshness(
          { periodEnd: "2026-10-19", validUntil: null },
          7,
          now,
        ),
        "stale",
      );
      assert.equal(
        observationFreshness(
          { periodEnd: "2026-10-26", validUntil: "2026-10-26" },
          7,
          now,
        ),
        "expired",
      );
      assert.equal(
        observationFreshness(
          { periodEnd: "2026-10-26", validUntil: "2026-10-27" },
          7,
          now,
        ),
        "current",
      );
    });

    it("synchronizes and retries idempotently; a source revision appends history", async () => {
      for (const [value, inserted] of [
        [5.5007, 1],
        [5.5007, 0],
        [5.5012, 1],
      ]) {
        assert.equal(
          (
            await synchronizeSource(db, fixtures.manager.id, "BCB_PTAX", {
              now: nextTime(),
              fetchSource: response(ptax(value)),
            })
          ).inserted,
          inserted,
        );
      }
      const series = await db.externalSeries.findUniqueOrThrow({
        where: { connector: "BCB_PTAX" },
      });
      const rows = await db.externalObservation.findMany({
        where: { seriesId: series.id },
        orderBy: { revision: "asc" },
      });
      assert.deepEqual(
        rows.map((row) => row.value.toFixed(4)),
        ["5.5007", "5.5012"],
      );
      assert.ok(
        rows.every((row) => row.origin === "API" && row.createdById === null),
      );
      await assert.rejects(
        saveManualObservation(
          db,
          fixtures.manager.id,
          series.id,
          observation(),
          now,
        ),
        code("serie"),
      );
    });

    it("stores IBGE quarterly data without rounding or changing its scope", async () => {
      const result = await synchronizeSource(
        db,
        fixtures.manager.id,
        "IBGE_SLAUGHTER_BA",
        { now: nextTime(), fetchSource: response(ibge()) },
      );
      assert.equal(result.inserted, 1);
      const row = (await listPublicExternalData(db, 1, now)).items.find(
        (item) => item.connector === "IBGE_SLAUGHTER_BA",
      )!;
      assert.equal(row.observation?.periodEnd, "2026-06-30");
      assert.equal(row.observation?.value, "389905.0000");
      assert.equal(row.unit, "cabeças");
    });

    it("preserves stored data and last success when a subsequent source request fails", async () => {
      const series = await db.externalSeries.findUniqueOrThrow({
        where: { connector: "BCB_PTAX" },
      });
      const previous = await db.externalSync.findUniqueOrThrow({
        where: { connector: "BCB_PTAX" },
      });
      const count = await db.externalObservation.count({
        where: { seriesId: series.id },
      });
      await assert.rejects(
        synchronizeSource(db, fixtures.manager.id, "BCB_PTAX", {
          now: nextTime(),
          fetchSource: async () => new Response("failure", { status: 500 }),
        }),
        code("fonte"),
      );
      assert.equal(
        await db.externalObservation.count({ where: { seriesId: series.id } }),
        count,
      );
      const sync = await db.externalSync.findUniqueOrThrow({
        where: { connector: "BCB_PTAX" },
      });
      assert.equal(sync.status, "FAILED");
      assert.equal(
        sync.succeededAt?.getTime(),
        previous.succeededAt?.getTime(),
      );
      assert.equal(
        (await listPublicExternalData(db)).items.find(
          (item) => item.id === series.id,
        )?.observation?.value,
        "5.5012",
      );
    });

    it("bounds concurrent source requests globally and rejects unknown connectors before networking", async () => {
      let calls = 0;
      const options = {
        now: nextTime(),
        fetchSource: async () => {
          calls++;
          return Response.json(ptax(5.5012));
        },
      };
      const results = await Promise.allSettled([
        synchronizeSource(db, fixtures.manager.id, "BCB_PTAX", options),
        synchronizeSource(db, fixtures.manager.id, "BCB_PTAX", options),
      ]);
      assert.equal(calls, 1);
      assert.equal(
        results.filter((result) => result.status === "fulfilled").length,
        1,
      );
      await assert.rejects(
        synchronizeSource(
          db,
          fixtures.manager.id,
          "https://example.invalid/",
          options,
        ),
      );
      assert.equal(calls, 1);
    });

    it("rolls back an entire invalid batch and keeps manual fallback series independent", async () => {
      const count = await db.externalObservation.count();
      const bad = {
        value: [
          ...ptax().value,
          { cotacaoVenda: -2, dataHoraCotacao: "2026-10-25 13:00:00" },
        ],
      };
      await assert.rejects(
        synchronizeSource(db, fixtures.manager.id, "BCB_PTAX", {
          now: nextTime(),
          fetchSource: response(bad),
        }),
        code("formato"),
      );
      assert.equal(await db.externalObservation.count(), count);
      const id = await createSeries({ metric: "USD_BRL" });
      await saveManualObservation(
        db,
        fixtures.manager.id,
        id,
        observation("6.1234"),
        now,
      );
      await synchronizeSource(db, fixtures.manager.id, "BCB_PTAX", {
        now: nextTime(),
        fetchSource: response(ptax(5.5012)),
      });
      assert.equal(
        (
          await getExternalHistory(db, fixtures.manager.id, id)
        )?.rows[0].value.toFixed(4),
        "6.1234",
      );
    });

    it("bounds pagination and returns no history for unknown or malformed IDs", async () => {
      assert.equal((await listPublicExternalData(db, Infinity)).page, 1);
      assert.equal((await listPublicExternalData(db, 100_000)).items.length, 0);
      assert.equal(
        await getExternalHistory(db, fixtures.manager.id, "invalid"),
        null,
      );
      assert.equal(
        await getExternalHistory(db, fixtures.manager.id, randomUUID()),
        null,
      );
    });
  },
);
