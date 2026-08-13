import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOrder,
  deleteOrder,
  getOrders,
  seedOrdersIfEmpty,
  updateOrder,
} from "@/lib/orders";

const STORAGE_KEY = "wayam.production-orders";
const SEEDED_KEY = "wayam.seeded";

const SAMPLE_INPUT = {
  name: "Widget batch A",
  quantity: 100,
  producedQty: 0,
  scheduledDate: "2026-09-01",
  dueDate: "2026-09-05",
  line: "Line 1" as const,
  bomVersion: "v1.0",
  status: "draft" as const,
};

beforeEach(() => {
  localStorage.clear();
});

describe("orders data layer", () => {
  it("returns an empty array when nothing is stored", () => {
    expect(getOrders()).toEqual([]);
  });

  it("creates an order and persists it to localStorage", () => {
    const order = createOrder(SAMPLE_INPUT);

    expect(order.id).toBeTruthy();
    expect(order.name).toBe("Widget batch A");
    expect(order.producedQty).toBe(0);
    expect(order.dueDate).toBe("2026-09-05");
    expect(order.line).toBe("Line 1");
    expect(order.bomVersion).toBe("v1.0");
    expect(getOrders()).toHaveLength(1);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(order.id);
  });

  it("updates an existing order", async () => {
    const order = createOrder(SAMPLE_INPUT);

    await new Promise((resolve) => setTimeout(resolve, 2));

    const updated = updateOrder(order.id, {
      status: "in_progress",
      quantity: 150,
      producedQty: 40,
    });

    expect(updated?.status).toBe("in_progress");
    expect(updated?.quantity).toBe(150);
    expect(updated?.producedQty).toBe(40);
    expect(updated?.updatedAt).not.toBe(order.updatedAt);
  });

  it("returns null when updating a non-existent order", () => {
    expect(updateOrder("does-not-exist", { status: "completed" })).toBeNull();
  });

  it("deletes an order", () => {
    const order = createOrder(SAMPLE_INPUT);

    deleteOrder(order.id);

    expect(getOrders()).toHaveLength(0);
  });

  it("seeds sample orders once, tracked via a seeded flag rather than emptiness", () => {
    seedOrdersIfEmpty();
    const first = getOrders();
    expect(first.length).toBeGreaterThan(0);
    expect(localStorage.getItem(SEEDED_KEY)).toBeTruthy();

    seedOrdersIfEmpty();
    const second = getOrders();
    expect(second).toHaveLength(first.length);
  });

  it("seeds orders with the new Production fields populated", () => {
    seedOrdersIfEmpty();
    const seeded = getOrders();
    expect(seeded.every((o) => o.dueDate)).toBe(true);
    expect(seeded.every((o) => ["Line 1", "Line 2", "Line 3", "Line 4"].includes(o.line))).toBe(
      true
    );
    expect(seeded.every((o) => o.bomVersion)).toBe(true);
    expect(seeded.every((o) => typeof o.producedQty === "number")).toBe(true);
    expect(seeded.some((o) => o.status === "completed")).toBe(true);
    expect(seeded.some((o) => o.status === "on_hold")).toBe(true);
  });

  it("does not reseed after all orders are deleted (seeded flag persists)", () => {
    seedOrdersIfEmpty();
    const seeded = getOrders();
    expect(seeded.length).toBeGreaterThan(0);

    seeded.forEach((order) => deleteOrder(order.id));
    expect(getOrders()).toHaveLength(0);

    seedOrdersIfEmpty();
    expect(getOrders()).toHaveLength(0);
  });

  it("propagates an error from createOrder when localStorage.setItem throws", () => {
    const setItemSpy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => createOrder(SAMPLE_INPUT)).toThrow();

    setItemSpy.mockRestore();
  });
});
