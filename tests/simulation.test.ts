import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateSimulation } from "@/features/simulation/calculate";
import { simulationSchema } from "@/features/simulation/schema";

const input = {
  liveWeight: "500",
  yieldPercent: "55",
  arrobaPrice: "300",
  totalCost: "4000",
  alternativePrice: "",
};

describe("Per-animal revenue simulation", () => {
  it("uses percentage yield and 15kg arrobas with full intermediate precision", () => {
    assert.deepEqual(calculateSimulation(input), {
      carcassWeight: "275.000",
      arrobas: "18.3333",
      revenue: "5500.00",
      cost: "4000.00",
      margin: "1500.00",
      breakEvenPrice: "218.18",
      alternative: null,
    });
  });
  it("compares an explicit alternative price without changing costs or yield", () => {
    assert.deepEqual(
      calculateSimulation({ ...input, alternativePrice: "270" }).alternative,
      {
        price: "270",
        revenue: "4950.00",
        margin: "950.00",
        revenueDifference: "-550.00",
      },
    );
    assert.equal(
      calculateSimulation({ ...input, alternativePrice: "330" }).alternative
        ?.revenueDifference,
      "550.00",
    );
  });
  it("keeps zero cost, negative margin and break-even scenarios explicit", () => {
    assert.equal(
      calculateSimulation({ ...input, totalCost: "0" }).margin,
      "5500.00",
    );
    assert.equal(
      calculateSimulation({ ...input, totalCost: "6000" }).margin,
      "-500.00",
    );
    assert.equal(
      calculateSimulation({ ...input, totalCost: "5500" }).margin,
      "0.00",
    );
  });
  it("normalizes decimal commas and rounds only final monetary values to cents", () => {
    const result = calculateSimulation({
      ...input,
      liveWeight: "499,999",
      yieldPercent: "52,35",
      arrobaPrice: "299,99",
      totalCost: "3000,01",
    });
    assert.equal(result.revenue, "5234.82");
    assert.equal(result.margin, "2234.81");
    assert.equal(
      calculateSimulation({
        ...input,
        liveWeight: "1",
        yieldPercent: "50",
        arrobaPrice: "0.15",
        totalCost: "0",
      }).revenue,
      "0.01",
    );
  });
  it("rejects impossible, missing, malformed, excessive and forged inputs", () => {
    for (const patch of [
      { liveWeight: "0" },
      { liveWeight: "2000.001" },
      { liveWeight: "1.1234" },
      { yieldPercent: "0" },
      { yieldPercent: "100.01" },
      { arrobaPrice: "0" },
      { arrobaPrice: "1000000.01" },
      { totalCost: "-1" },
      { totalCost: "10000000.01" },
      { totalCost: "4.000,00" },
      { arrobaPrice: "1e3" },
      { totalCost: "NaN" },
      { liveWeight: "" },
      { totalCost: "1.001" },
      { alternativePrice: "0" },
      { userId: "forged" },
    ])
      assert.equal(
        simulationSchema.safeParse({ ...input, ...patch }).success,
        false,
      );
  });
  it("handles operational input boundaries without overflow or nonfinite values", () => {
    const maximum = calculateSimulation({
      liveWeight: "2000",
      yieldPercent: "100",
      arrobaPrice: "1000000",
      totalCost: "10000000",
      alternativePrice: "1000000",
    });
    assert.equal(maximum.revenue, "133333333.33");
    assert.equal(maximum.margin, "123333333.33");
    const minimum = calculateSimulation({
      liveWeight: "0.001",
      yieldPercent: "0.01",
      arrobaPrice: "0.01",
      totalCost: "10000000",
      alternativePrice: "",
    });
    assert.equal(minimum.breakEvenPrice, "1500000000000000.00");
    assert.ok(!JSON.stringify(minimum).includes("Infinity"));
  });
});
