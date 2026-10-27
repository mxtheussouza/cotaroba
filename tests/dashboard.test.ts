import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { dashboardPeriod } from "@/features/dashboard/filters";
import {
  priceVariation,
  replacementRatio,
} from "@/features/dashboard/indicators";

const now = new Date("2026-10-27T15:00:00Z");

describe("Dashboard filters and indicators", () => {
  it("defaults to the latest 90 civil dates in Bahia", () => {
    assert.deepEqual(dashboardPeriod({}, now), {
      start: "2026-07-30",
      end: "2026-10-27",
      error: null,
    });
    assert.equal(
      dashboardPeriod({}, new Date("2026-10-28T01:00:00Z")).end,
      "2026-10-27",
    );
  });

  it("validates leap dates, ordering, future dates and a maximum of 366 dates", () => {
    for (const search of [
      { inicio: "2026-02-30", fim: "2026-10-27" },
      { inicio: "2026-10-27", fim: "2026-10-26" },
      { inicio: "2026-10-27", fim: "2026-10-28" },
      { inicio: "2025-01-01", fim: "2026-10-27" },
      { inicio: ["2026-10-26"], fim: "2026-10-27" },
    ])
      assert.ok(dashboardPeriod(search, now).error);
    assert.equal(
      dashboardPeriod({ inicio: "2025-10-27", fim: "2026-10-27" }, now).error,
      null,
    );
    assert.equal(
      dashboardPeriod({ inicio: "2024-02-29", fim: "2024-02-29" }, now).error,
      null,
    );
  });

  it("calculates exact increases, decreases and unchanged prices without regional averages", () => {
    assert.deepEqual(priceVariation("300", "330"), {
      absolute: "30.0000",
      percent: "10.00",
    });
    assert.deepEqual(priceVariation("300", "270"), {
      absolute: "-30.0000",
      percent: "-10.00",
    });
    assert.deepEqual(priceVariation("0.10", "0.11"), {
      absolute: "0.0100",
      percent: "10.00",
    });
    assert.deepEqual(priceVariation("300", "300"), {
      absolute: "0.0000",
      percent: "0.00",
    });
    assert.deepEqual(priceVariation("0", "12"), {
      absolute: "12.0000",
      percent: null,
    });
  });

  it("expresses replacement as arrobas needed per calf without assuming a carcass weight", () => {
    const base = {
      geography: "Bahia",
      frequency: "DAILY",
      periodStart: "2026-10-26",
      periodEnd: "2026-10-26",
      freshness: "current",
    };
    const arroba = { ...base, metric: "ARROBA_REFERENCE", value: "300" };
    const calf = { ...base, metric: "CALF_PRICE", value: "2400" };
    assert.equal(replacementRatio(arroba, calf), "8.0000");
    assert.equal(
      replacementRatio(arroba, { ...calf, geography: "  BAHIA  " }),
      "8.0000",
    );
    assert.equal(replacementRatio(null, calf), null);
    for (const patch of [
      { metric: "USD_BRL" },
      { geography: "Outra região" },
      { frequency: "WEEKLY" },
      { periodStart: "2026-10-25" },
      { periodEnd: "2026-10-25" },
      { freshness: "stale" },
      { freshness: "expired" },
      { value: "0" },
    ])
      assert.equal(replacementRatio(arroba, { ...calf, ...patch }), null);
    assert.equal(replacementRatio({ ...arroba, value: "0" }, calf), null);
  });
});
