import { beforeEach, describe, expect, it } from "vitest";
import { createOrder } from "@/lib/orders";
import { formatWorkOrderId, getTraceScore } from "@/lib/production";
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

describe("getTraceScore", () => {
  it("returns null when the order has no produced units", () => {
    const order = createOrder({ ...ORDER_INPUT, producedQty: 0 });
    expect(getTraceScore(order)).toBeNull();
  });

  it("returns null when there are no build records for the order", () => {
    const order = createOrder(ORDER_INPUT);
    writeBuilds([]);
    expect(getTraceScore(order)).toBeNull();
  });

  it("scores 100% green when every build passes all checks", () => {
    const order = createOrder(ORDER_INPUT);
    writeBuilds([makeBuild(order), makeBuild(order)]);
    expect(getTraceScore(order)).toEqual({ percent: 100, band: "green" });
  });

  it("scores in the amber band between 70 and 94 percent", () => {
    const order = createOrder(ORDER_INPUT);
    writeBuilds([
      makeBuild(order),
      makeBuild(order),
      makeBuild(order),
      makeBuild(order, { qcResult: "fail" }),
    ]);
    // 3 of 4 passing = 75%
    expect(getTraceScore(order)).toEqual({ percent: 75, band: "amber" });
  });

  it("scores in the red band below 70 percent", () => {
    const order = createOrder(ORDER_INPUT);
    writeBuilds([makeBuild(order), makeBuild(order, { qcResult: "fail" })]);
    // 1 of 2 passing = 50%
    expect(getTraceScore(order)).toEqual({ percent: 50, band: "red" });
  });

  it("only counts builds linked to this order", () => {
    const order = createOrder(ORDER_INPUT);
    const otherOrder = createOrder({ ...ORDER_INPUT, name: "Widget batch B" });
    writeBuilds([makeBuild(order), makeBuild(otherOrder, { qcResult: "fail" })]);
    expect(getTraceScore(order)).toEqual({ percent: 100, band: "green" });
  });
});

describe("formatWorkOrderId", () => {
  it("formats the order id as a short WO- code", () => {
    const order = createOrder(ORDER_INPUT);
    const formatted = formatWorkOrderId(order);
    expect(formatted).toMatch(/^WO-[0-9A-F]{6}$/);
  });
});
