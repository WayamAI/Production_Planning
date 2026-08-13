import { beforeEach, describe, expect, it } from "vitest";
import { createOrder } from "@/lib/orders";
import { getLiveMetrics, getMockMetrics, getTraceCompletenessByLine, getMaterialCoverageTrend, getMissingScanExceptions, getMrpRunStatus, getStockExhaustionAlerts } from "@/lib/overview";
import type { BuildRecord, ProductionOrder } from "@/lib/types";

const BUILDS_KEY = "wayam.traceability.builds";

function writeBuilds(builds: BuildRecord[]): void {
  localStorage.setItem(BUILDS_KEY, JSON.stringify(builds));
}

function makeBuild(order: ProductionOrder, overrides: Partial<BuildRecord> = {}): BuildRecord {
  return {
    serial: `SN-TEST-${Math.random().toString(36).slice(2, 8)}`,
    orderId: order.id,
    assemblyDate: order.scheduledDate,
    workCentre: "WC-01 Mixing",
    operator: "OP-045 Suresh P.",
    lotsConsumed: ["LOT-2026-0178"],
    qcResult: "pass",
    processParams: [],
    designCheckPass: true,
    supplierCheckPass: true,
    shipped: true,
    returned: false,
    ...overrides,
  };
}

const ORDER_INPUT = {
  name: "Widget batch A",
  quantity: 300,
  producedQty: 300,
  scheduledDate: "2026-09-01",
  dueDate: "2026-09-08",
  line: "Line 1" as const,
  bomVersion: "v1.0",
  status: "completed" as const,
};

beforeEach(() => {
  localStorage.clear();
});

describe("getLiveMetrics", () => {
  it("counts pending work orders as every non-completed order", () => {
    createOrder({ ...ORDER_INPUT, status: "completed" });
    createOrder({ ...ORDER_INPUT, status: "in_progress" });
    createOrder({ ...ORDER_INPUT, status: "draft" });
    const metrics = getLiveMetrics();
    const pending = metrics.find((m) => m.label === "Pending Work Orders");
    expect(pending?.value).toBe("2");
  });

  it("flags pending work orders as a warning when any are on_hold", () => {
    createOrder({ ...ORDER_INPUT, status: "on_hold" });
    const metrics = getLiveMetrics();
    const pending = metrics.find((m) => m.label === "Pending Work Orders");
    expect(pending?.tone).toBe("warning");
  });

  it("averages trace score across orders that have build records", () => {
    const order = createOrder(ORDER_INPUT);
    writeBuilds([makeBuild(order), makeBuild(order)]);
    const metrics = getLiveMetrics();
    const trace = metrics.find((m) => m.label === "Trace Completeness");
    expect(trace?.value).toBe("100%");
    expect(trace?.tone).toBe("good");
  });

  it("reports zero trace completeness when no orders have build records", () => {
    createOrder(ORDER_INPUT);
    const metrics = getLiveMetrics();
    const trace = metrics.find((m) => m.label === "Trace Completeness");
    expect(trace?.value).toBe("0%");
    expect(trace?.tone).toBe("critical");
  });

  it("counts active suspect lots from critical alerts", () => {
    const order = createOrder(ORDER_INPUT);
    writeBuilds([makeBuild(order, { qcResult: "fail", lotsConsumed: ["LOT-2026-0189"] })]);
    const metrics = getLiveMetrics();
    const suspect = metrics.find((m) => m.label === "Active Suspect Lots");
    expect(suspect?.value).toBe("1");
    expect(suspect?.tone).toBe("critical");
  });

  it("reports 100% recall accuracy when nothing has shipped", () => {
    const metrics = getLiveMetrics();
    const recall = metrics.find((m) => m.label === "Recall Accuracy");
    expect(recall?.value).toBe("100%");
  });

  it("reports 100% schedule adherence when there are no completed orders", () => {
    createOrder({ ...ORDER_INPUT, status: "in_progress" });
    const metrics = getLiveMetrics();
    const adherence = metrics.find((m) => m.label === "Schedule Adherence");
    expect(adherence?.value).toBe("100%");
  });

  it("computes schedule adherence from completed orders finishing on or before their due date", () => {
    createOrder({ ...ORDER_INPUT, status: "completed", scheduledDate: "2026-09-01", dueDate: "2026-09-05" });
    createOrder({ ...ORDER_INPUT, status: "completed", scheduledDate: "2026-09-10", dueDate: "2026-09-05" });
    const metrics = getLiveMetrics();
    const adherence = metrics.find((m) => m.label === "Schedule Adherence");
    expect(adherence?.value).toBe("50%");
  });
});

describe("getMockMetrics", () => {
  it("returns ten correctly-typed metrics", () => {
    const metrics = getMockMetrics();
    expect(metrics).toHaveLength(10);
    metrics.forEach((m) => {
      expect(typeof m.label).toBe("string");
      expect(typeof m.value).toBe("string");
      expect(["critical", "warning", "good"]).toContain(m.tone);
    });
  });
});

describe("getTraceCompletenessByLine", () => {
  it("groups build records by work centre and computes pass percentage", () => {
    const order = createOrder(ORDER_INPUT);
    writeBuilds([
      makeBuild(order, { workCentre: "WC-01 Mixing" }),
      makeBuild(order, { workCentre: "WC-01 Mixing", qcResult: "fail" }),
      makeBuild(order, { workCentre: "WC-02 Filling" }),
    ]);
    const byLine = getTraceCompletenessByLine();
    const mixing = byLine.find((l) => l.line === "WC-01 Mixing");
    const filling = byLine.find((l) => l.line === "WC-02 Filling");
    expect(mixing?.value).toBe(50);
    expect(filling?.value).toBe(100);
  });

  it("returns an empty array when there are no build records", () => {
    expect(getTraceCompletenessByLine()).toEqual([]);
  });
});

describe("mock data getters", () => {
  it("getMrpRunStatus returns correctly-typed data", () => {
    const status = getMrpRunStatus();
    expect(status.plannedOrders).toBeGreaterThan(0);
    expect(status.exceptions).toBeGreaterThanOrEqual(0);
  });

  it("getStockExhaustionAlerts returns a non-empty list", () => {
    expect(getStockExhaustionAlerts().length).toBeGreaterThan(0);
  });

  it("getMissingScanExceptions returns a non-empty list with at least one resolved entry", () => {
    const exceptions = getMissingScanExceptions();
    expect(exceptions.length).toBeGreaterThan(0);
    expect(exceptions.some((e) => e.resolved)).toBe(true);
  });

  it("getMaterialCoverageTrend returns 8 weeks of data", () => {
    expect(getMaterialCoverageTrend()).toHaveLength(8);
  });
});
