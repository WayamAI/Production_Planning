import { beforeEach, describe, expect, it } from "vitest";
import { createOrder } from "@/lib/orders";
import { formatWorkOrderId, getConstraints, getTraceScore } from "@/lib/production";
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

describe("getConstraints", () => {
  it("is deterministic and idempotent given the same orders", () => {
    createOrder({ ...ORDER_INPUT, status: "on_hold" });
    const first = getConstraints();
    const second = getConstraints();
    expect(second).toEqual(first);
  });

  it("creates a linked constraint for every on_hold order", () => {
    const order = createOrder({ ...ORDER_INPUT, status: "on_hold" });
    const constraints = getConstraints();
    expect(constraints.some((c) => c.orderId === order.id)).toBe(true);
  });

  it("creates a linked constraint for every overdue order", () => {
    const order = createOrder({ ...ORDER_INPUT, status: "overdue" });
    const constraints = getConstraints();
    expect(constraints.some((c) => c.orderId === order.id)).toBe(true);
  });

  it("includes flavor constraints even with no on_hold/overdue orders", () => {
    createOrder({ ...ORDER_INPUT, status: "in_progress" });
    const constraints = getConstraints();
    expect(constraints.length).toBeGreaterThan(0);
    expect(constraints.every((c) => c.orderId === undefined)).toBe(true);
  });

  it("assigns each constraint a unique id", () => {
    createOrder({ ...ORDER_INPUT, status: "on_hold" });
    const constraints = getConstraints();
    const ids = new Set(constraints.map((c) => c.id));
    expect(ids.size).toBe(constraints.length);
  });
});
