import { beforeEach, describe, expect, it } from "vitest";
import { createOrder } from "@/lib/orders";
import { getOrders } from "@/lib/orders";
import {
  getBuildRecords,
  getLots,
  getSuppliers,
  getWarrantyClaims,
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
