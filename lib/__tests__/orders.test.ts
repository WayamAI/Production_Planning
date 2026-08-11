import { beforeEach, describe, expect, it } from "vitest";
import {
  createOrder,
  deleteOrder,
  getOrders,
  seedOrdersIfEmpty,
  updateOrder,
} from "@/lib/orders";

const STORAGE_KEY = "wayam.production-orders";

beforeEach(() => {
  localStorage.clear();
});

describe("orders data layer", () => {
  it("returns an empty array when nothing is stored", () => {
    expect(getOrders()).toEqual([]);
  });

  it("creates an order and persists it to localStorage", () => {
    const order = createOrder({
      name: "Widget batch A",
      quantity: 100,
      scheduledDate: "2026-09-01",
      status: "pending",
    });

    expect(order.id).toBeTruthy();
    expect(order.name).toBe("Widget batch A");
    expect(getOrders()).toHaveLength(1);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(order.id);
  });

  it("updates an existing order", async () => {
    const order = createOrder({
      name: "Widget batch A",
      quantity: 100,
      scheduledDate: "2026-09-01",
      status: "pending",
    });

    await new Promise((resolve) => setTimeout(resolve, 2));

    const updated = updateOrder(order.id, { status: "in_progress", quantity: 150 });

    expect(updated?.status).toBe("in_progress");
    expect(updated?.quantity).toBe(150);
    expect(updated?.updatedAt).not.toBe(order.updatedAt);
  });

  it("returns null when updating a non-existent order", () => {
    expect(updateOrder("does-not-exist", { status: "done" })).toBeNull();
  });

  it("deletes an order", () => {
    const order = createOrder({
      name: "Widget batch A",
      quantity: 100,
      scheduledDate: "2026-09-01",
      status: "pending",
    });

    deleteOrder(order.id);

    expect(getOrders()).toHaveLength(0);
  });

  it("seeds sample orders only when storage is empty", () => {
    seedOrdersIfEmpty();
    const first = getOrders();
    expect(first.length).toBeGreaterThan(0);

    seedOrdersIfEmpty();
    const second = getOrders();
    expect(second).toHaveLength(first.length);
  });
});
