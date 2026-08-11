import type { CreateOrderInput, ProductionOrder, UpdateOrderInput } from "@/lib/types";

const STORAGE_KEY = "wayam.production-orders";

function readAll(): ProductionOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProductionOrder[]) : [];
  } catch {
    return [];
  }
}

function writeAll(orders: ProductionOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Storage unavailable/full — caller surfaces this via toast.
  }
}

export function getOrders(): ProductionOrder[] {
  return readAll().sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

export function createOrder(input: CreateOrderInput): ProductionOrder {
  const now = new Date().toISOString();
  const order: ProductionOrder = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  writeAll([...readAll(), order]);
  return order;
}

export function updateOrder(id: string, patch: UpdateOrderInput): ProductionOrder | null {
  const all = readAll();
  const index = all.findIndex((order) => order.id === id);
  if (index === -1) return null;

  const updated: ProductionOrder = {
    ...all[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  writeAll(all);
  return updated;
}

export function deleteOrder(id: string): void {
  writeAll(readAll().filter((order) => order.id !== id));
}

export function seedOrdersIfEmpty(): void {
  if (readAll().length > 0) return;

  const today = new Date();
  const daysFromNow = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const seed: Array<CreateOrderInput> = [
    { name: "Widget batch A", quantity: 500, scheduledDate: daysFromNow(2), status: "pending" },
    { name: "Widget batch B", quantity: 250, scheduledDate: daysFromNow(-1), status: "in_progress" },
    { name: "Gasket run 12", quantity: 1200, scheduledDate: daysFromNow(-5), status: "done" },
    { name: "Bracket order 7", quantity: 80, scheduledDate: daysFromNow(5), status: "pending" },
    { name: "Housing batch C", quantity: 300, scheduledDate: daysFromNow(1), status: "in_progress" },
  ];

  seed.forEach((input) => createOrder(input));
}
