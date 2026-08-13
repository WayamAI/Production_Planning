import type { CreateOrderInput, ProductionOrder, UpdateOrderInput } from "@/lib/types";

const STORAGE_KEY = "wayam.production-orders";
const SEEDED_KEY = "wayam.seeded";

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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  // Any error here (storage unavailable/full) propagates to the caller,
  // which is responsible for surfacing it (e.g. via a toast).
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
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEEDED_KEY)) return;

  window.localStorage.setItem(SEEDED_KEY, "true");

  const today = new Date();
  const daysFromNow = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const seed: Array<CreateOrderInput> = [
    {
      name: "Widget batch A",
      quantity: 500,
      producedQty: 0,
      scheduledDate: daysFromNow(2),
      dueDate: daysFromNow(4),
      line: "Line 1",
      bomVersion: "v1.0",
      status: "draft",
    },
    {
      name: "Widget batch B",
      quantity: 250,
      producedQty: 180,
      scheduledDate: daysFromNow(-1),
      dueDate: daysFromNow(2),
      line: "Line 2",
      bomVersion: "v2.1",
      status: "in_progress",
    },
    {
      name: "Gasket run 12",
      quantity: 1200,
      producedQty: 1200,
      scheduledDate: daysFromNow(-5),
      dueDate: daysFromNow(-2),
      line: "Line 3",
      bomVersion: "v1.4",
      status: "completed",
    },
    {
      name: "Bracket order 7",
      quantity: 80,
      producedQty: 0,
      scheduledDate: daysFromNow(5),
      dueDate: daysFromNow(7),
      line: "Line 4",
      bomVersion: "v3.0",
      status: "released",
    },
    {
      name: "Housing batch C",
      quantity: 300,
      producedQty: 90,
      scheduledDate: daysFromNow(1),
      dueDate: daysFromNow(3),
      line: "Line 1",
      bomVersion: "v2.0",
      status: "on_hold",
    },
  ];

  seed.forEach((input) => createOrder(input));
}
