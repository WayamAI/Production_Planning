import { beforeEach, describe, expect, it } from "vitest";
import { createOrder } from "@/lib/orders";
import { getOrders } from "@/lib/orders";
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
    const order = createOrder({
      name: "Widget batch A",
      quantity: 300,
      scheduledDate: "2026-09-01",
      status: "done",
    });

    seedTraceabilityIfEmpty(getOrders());
    const builds = getBuildRecords();

    expect(builds.length).toBeGreaterThan(0);
    expect(builds.every((b) => b.orderId === order.id)).toBe(true);
  });

  it("is deterministic and idempotent across repeated calls", () => {
    createOrder({ name: "Widget batch A", quantity: 300, scheduledDate: "2026-09-01", status: "done" });
    seedTraceabilityIfEmpty(getOrders());
    const first = getBuildRecords();

    seedTraceabilityIfEmpty(getOrders());
    const second = getBuildRecords();

    expect(second).toEqual(first);
  });

  it("injects a failed-lot thread and a process-deviation thread", () => {
    createOrder({ name: "Widget batch A", quantity: 300, scheduledDate: "2026-09-01", status: "done" });
    seedTraceabilityIfEmpty(getOrders());
    const builds = getBuildRecords();

    expect(
      builds.some((b) => b.lotsConsumed.includes("LOT-2026-0189") && b.qcResult === "fail")
    ).toBe(true);
    expect(builds.some((b) => b.qcResult === "conditional" || b.qcResult === "fail")).toBe(true);
    expect(getWarrantyClaims().length).toBe(2);
  });
});

describe("searchTrace", () => {
  beforeEach(() => {
    createOrder({ name: "Widget batch A", quantity: 300, scheduledDate: "2026-09-01", status: "done" });
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
    createOrder({ name: "Widget batch B", quantity: 300, scheduledDate: "2026-09-02", status: "done" });
    seedTraceabilityIfEmpty(getOrders());
    expect(getCriticalAlerts().length).toBeGreaterThanOrEqual(1);
  });
});

describe("getPopulationAtRisk", () => {
  beforeEach(() => {
    createOrder({ name: "Widget batch A", quantity: 300, scheduledDate: "2026-09-01", status: "done" });
    createOrder({ name: "Widget batch B", quantity: 300, scheduledDate: "2026-09-02", status: "done" });
    seedTraceabilityIfEmpty(getOrders());
  });

  it("keeps each funnel stage at or below the stage before it", () => {
    const funnel = getPopulationAtRisk({});
    expect(funnel.lotUsedInBuild).toBeLessThanOrEqual(funnel.totalProduced);
    expect(funnel.assembledPassedQc).toBeLessThanOrEqual(funnel.lotUsedInBuild);
    expect(funnel.shippedToField).toBeLessThanOrEqual(funnel.assembledPassedQc);
    expect(funnel.atRiskInField).toBeLessThanOrEqual(funnel.shippedToField);
    expect(funnel.returnedDefective).toBeLessThanOrEqual(funnel.shippedToField);
  });

  it("narrows the funnel when filtered to the suspect lot", () => {
    const filtered = getPopulationAtRisk({ lotNumber: "LOT-2026-0189" });
    expect(filtered.lotUsedInBuild).toBeGreaterThan(0);
    expect(filtered.affectedSerials.every((b) => b.lotsConsumed.includes("LOT-2026-0189"))).toBe(true);
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
