import { beforeEach, describe, expect, it } from "vitest";
import { createOrder, deleteOrder } from "@/lib/orders";
import { getOrders } from "@/lib/orders";
import type { CreateOrderInput } from "@/lib/types";
import {
  getBuildRecords,
  getCriticalAlerts,
  getContainmentPriority,
  getLots,
  getPopulationAtRisk,
  getSuppliers,
  getWarrantyClaims,
  searchTrace,
  seedTraceabilityIfEmpty,
} from "@/lib/traceability";

function makeOrderInput(overrides: Partial<CreateOrderInput> = {}): CreateOrderInput {
  return {
    name: "Widget batch A",
    quantity: 300,
    producedQty: 300,
    scheduledDate: "2026-09-01",
    dueDate: "2026-09-08",
    line: "Line 1",
    bomVersion: "v1.0",
    status: "completed",
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("static reference pools", () => {
  it("exposes suppliers and lots, including one failed-inspection lot", () => {
    expect(getSuppliers().length).toBeGreaterThan(0);
    expect(getLots().length).toBeGreaterThan(0);
    expect(getLots().some((lot) => lot.inspectionResult === "failed")).toBe(true);
  });
});

describe("seedTraceabilityIfEmpty", () => {
  it("does nothing when there are no orders yet", () => {
    seedTraceabilityIfEmpty([]);
    expect(getBuildRecords()).toEqual([]);
  });

  it("seeds one build record per generated serial, all linked to the source order", () => {
    const order = createOrder(makeOrderInput());

    seedTraceabilityIfEmpty(getOrders());
    const builds = getBuildRecords();

    expect(builds.length).toBeGreaterThan(0);
    expect(builds.every((b) => b.orderId === order.id)).toBe(true);
  });

  it("is deterministic and idempotent across repeated calls", () => {
    createOrder(makeOrderInput());
    seedTraceabilityIfEmpty(getOrders());
    const first = getBuildRecords();

    seedTraceabilityIfEmpty(getOrders());
    const second = getBuildRecords();

    expect(second).toEqual(first);
  });

  it("injects a failed-lot thread and a process-deviation thread", () => {
    createOrder(makeOrderInput());
    seedTraceabilityIfEmpty(getOrders());
    const builds = getBuildRecords();

    expect(
      builds.some((b) => b.lotsConsumed.includes("LOT-2026-0189") && b.qcResult === "fail")
    ).toBe(true);
    expect(builds.some((b) => b.qcResult === "conditional" || b.qcResult === "fail")).toBe(true);
    expect(getWarrantyClaims().length).toBe(2);
  });

  it("generates build records for orders created after the first seed call, leaving prior builds untouched", () => {
    createOrder(makeOrderInput());
    seedTraceabilityIfEmpty(getOrders());
    const firstBuilds = getBuildRecords();

    const orderB = createOrder(
      makeOrderInput({ name: "Widget batch B", scheduledDate: "2026-09-02" })
    );
    seedTraceabilityIfEmpty(getOrders());
    const secondBuilds = getBuildRecords();

    expect(secondBuilds.some((b) => b.orderId === orderB.id)).toBe(true);
    const preservedFirstBuilds = secondBuilds.filter((b) =>
      firstBuilds.some((f) => f.serial === b.serial)
    );
    expect(preservedFirstBuilds).toEqual(firstBuilds);
  });

  it("prunes build records for orders that have since been deleted", () => {
    const orderA = createOrder(makeOrderInput());
    createOrder(makeOrderInput({ name: "Widget batch B", scheduledDate: "2026-09-02" }));
    seedTraceabilityIfEmpty(getOrders());

    deleteOrder(orderA.id);
    seedTraceabilityIfEmpty(getOrders());

    expect(getBuildRecords().some((b) => b.orderId === orderA.id)).toBe(false);
  });
});

describe("searchTrace", () => {
  beforeEach(() => {
    createOrder(makeOrderInput());
    seedTraceabilityIfEmpty(getOrders());
  });

  it("finds a build record by exact serial", () => {
    const [build] = getBuildRecords();
    const result = searchTrace(build.serial);
    expect(result.builds).toHaveLength(1);
    expect(result.builds[0].serial).toBe(build.serial);
  });

  it("finds every build consuming a lot, plus the upstream lot and supplier", () => {
    const result = searchTrace("LOT-2026-0189");
    expect(result.lot?.lotNumber).toBe("LOT-2026-0189");
    expect(result.supplier?.id).toBe("SUP-01");
    expect(result.builds.length).toBeGreaterThan(0);
    expect(result.builds.every((b) => b.lotsConsumed.includes("LOT-2026-0189"))).toBe(true);
  });

  it("returns an empty result for a query with no matches", () => {
    expect(searchTrace("does-not-exist").builds).toEqual([]);
  });
});

describe("getCriticalAlerts", () => {
  it("reports at least one alert once problem threads are seeded", () => {
    createOrder(makeOrderInput({ name: "Widget batch B", scheduledDate: "2026-09-02" }));
    seedTraceabilityIfEmpty(getOrders());
    expect(getCriticalAlerts().length).toBeGreaterThanOrEqual(1);
  });
});

describe("getPopulationAtRisk", () => {
  beforeEach(() => {
    createOrder(makeOrderInput());
    createOrder(makeOrderInput({ name: "Widget batch B", scheduledDate: "2026-09-02" }));
    seedTraceabilityIfEmpty(getOrders());
  });

  it("keeps each funnel stage at or below the stage before it", () => {
    const funnel = getPopulationAtRisk({});
    expect(funnel.lotUsedInBuild).toBeLessThanOrEqual(funnel.totalProduced);
    expect(funnel.shippedToField).toBeLessThanOrEqual(funnel.lotUsedInBuild);
    expect(funnel.atRiskInField).toBeLessThanOrEqual(funnel.shippedToField);
    expect(funnel.returnedDefective).toBeLessThanOrEqual(funnel.shippedToField);
  });

  it("narrows the funnel when filtered to the suspect lot", () => {
    const filtered = getPopulationAtRisk({ lotNumber: "LOT-2026-0189" });
    expect(filtered.lotUsedInBuild).toBeGreaterThan(0);
    expect(filtered.affectedSerials.every((b) => b.lotsConsumed.includes("LOT-2026-0189"))).toBe(
      true
    );
    expect(filtered.atRiskInField).toBeGreaterThanOrEqual(1);
    expect(filtered.returnedDefective).toBeGreaterThanOrEqual(1);
  });

  it("narrows the funnel when filtered by workCentre", () => {
    const all = getPopulationAtRisk({});
    const builds = getBuildRecords();
    const targetWorkCentre = builds[0].workCentre;

    const filtered = getPopulationAtRisk({ workCentre: targetWorkCentre });
    expect(filtered.lotUsedInBuild).toBeGreaterThan(0);
    expect(filtered.lotUsedInBuild).toBeLessThanOrEqual(all.lotUsedInBuild);
    expect(filtered.affectedSerials.every((b) => b.workCentre === targetWorkCentre)).toBe(true);
  });

  it("narrows the funnel when filtered by supplierId", () => {
    const all = getPopulationAtRisk({});
    const filtered = getPopulationAtRisk({ supplierId: "SUP-01" });

    expect(filtered.lotUsedInBuild).toBeGreaterThan(0);
    expect(filtered.lotUsedInBuild).toBeLessThanOrEqual(all.lotUsedInBuild);
    expect(
      filtered.affectedSerials.every((b) =>
        b.lotsConsumed.some((lot) =>
          ["LOT-2026-0178", "LOT-2026-0189", "LOT-2026-0230"].includes(lot)
        )
      )
    ).toBe(true);
  });
});

describe("getContainmentPriority", () => {
  it("labels Critical when at least 70% of shipped units are at risk", () => {
    expect(getContainmentPriority({ shippedToField: 10, atRiskInField: 7 })).toBe("Critical");
  });

  it("labels Low when nothing has shipped", () => {
    expect(getContainmentPriority({ shippedToField: 0, atRiskInField: 0 })).toBe("Low");
  });
});
