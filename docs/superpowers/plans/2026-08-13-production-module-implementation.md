# Production Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Production module (Schedule/Gantt, Work Orders, Constraints, Schedule Updates tabs) matching the reference product's Production section, integrated with the existing Production Orders and the previously-built Traceability module.

**Architecture:** Migrate `OrderStatus` from 3 to 6 states and extend `ProductionOrder` with the fields the reference's Work Orders table needs (`producedQty`, `dueDate`, `line`, `bomVersion`). A new `lib/production.ts` data layer computes Trace % from Traceability's `BuildRecord`s and deterministically derives Constraints and a Schedule Updates activity feed from orders/builds/lots — no new parallel dataset. Four new presentational components render under one `/dashboard/production` page with tabs, matching the pattern already used for Traceability.

**Tech Stack:** Next.js App Router, TypeScript, shadcn/ui (`Tabs`, `Select`, `Table`, `Button`), Tailwind CSS, Vitest.

## Global Constraints

- No backend, no new npm dependencies — everything persists in `localStorage`.
- Follow existing conventions exactly: `lib/*.ts` data modules read via try/catch-returning-safe-default, writes propagate errors to the caller; deterministic seeding uses the same `mulberry32`/`hashString`-per-id pattern already established in `lib/traceability.ts`.
- No new Work Order CRUD dialog — editing continues through the existing `OrderFormDialog`, extended with the new fields. Work Orders/Schedule/Constraints/Updates are read-only views.
- No work-order detail/drill-down page (confirmed absent in the reference product by live testing).
- No automated tests for React components — this codebase only unit-tests `lib/`. Component tasks are verified via `npx tsc --noEmit` + `npm run lint`; the final integration task is verified in a real browser.
- Design spec: `docs/superpowers/specs/2026-08-13-production-module-design.md`.
- This branch (`feature/production-module`) forks from `feature/bom-traceability`, not `main` — Trace % depends on `lib/traceability.ts`'s `getBuildRecords()`, `getLots()`, `getSuppliers()`.

---

### Task 1: Migrate OrderStatus to 6 states and extend ProductionOrder

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/order-status.ts`
- Modify: `lib/orders.ts`
- Modify: `components/dashboard/order-form-dialog.tsx`
- Modify: `lib/traceability.ts`
- Modify: `lib/__tests__/orders.test.ts`
- Modify: `lib/__tests__/traceability.test.ts`

**Interfaces:**
- Produces: `OrderStatus` (6 values: `draft`, `released`, `in_progress`, `completed`, `on_hold`, `overdue`), `ProductionLine` (`"Line 1" | "Line 2" | "Line 3" | "Line 4"`), `ProductionOrder` with new fields `producedQty: number`, `dueDate: string`, `line: ProductionLine`, `bomVersion: string`.

This task is a coordinated rename touching every call site of `OrderStatus`'s old values (`pending`/`done`) and every place that constructs a `CreateOrderInput`. Apply all steps below — leaving any one out breaks the build.

- [ ] **Step 1: Update `lib/types.ts`**

Replace the top of the file (the `OrderStatus`, `ProductionOrder`, `CreateOrderInput`, `UpdateOrderInput` declarations) with:

```ts
export type OrderStatus =
  | "draft"
  | "released"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "overdue";

export type ProductionLine = "Line 1" | "Line 2" | "Line 3" | "Line 4";

export interface ProductionOrder {
  id: string;
  name: string;
  quantity: number;
  producedQty: number;
  scheduledDate: string; // ISO date, e.g. "2026-08-20"
  dueDate: string; // ISO date
  line: ProductionLine;
  bomVersion: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  name: string;
  quantity: number;
  producedQty: number;
  scheduledDate: string;
  dueDate: string;
  line: ProductionLine;
  bomVersion: string;
  status: OrderStatus;
}

export type UpdateOrderInput = Partial<CreateOrderInput>;
```

Leave every other type in the file (`Supplier`, `MaterialLot`, `ProcessParam`, `QcResult`, `BuildRecord`, `WarrantyClaim`, `CriticalAlert`, `TraceResult`, `PopulationFilters`, `FunnelResult`) unchanged.

- [ ] **Step 2: Replace `lib/order-status.ts` in full**

```ts
import type { OrderStatus } from "@/lib/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  released: "Released",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
  overdue: "Overdue",
};

export const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  draft: "bg-muted text-muted-foreground hover:bg-muted",
  released: "bg-primary-100 text-primary-800 hover:bg-primary-100",
  in_progress: "bg-primary-300 text-primary-900 hover:bg-primary-300",
  completed: "bg-primary-600 text-white hover:bg-primary-600",
  on_hold: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  overdue: "bg-destructive/15 text-destructive hover:bg-destructive/15",
};
```

- [ ] **Step 3: Replace `lib/orders.ts` in full**

```ts
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
```

- [ ] **Step 4: Replace `components/dashboard/order-form-dialog.tsx` in full**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createOrder, updateOrder } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus, ProductionLine, ProductionOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderFormDialogProps {
  order?: ProductionOrder;
  onSaved: () => void;
  trigger: React.ReactNode;
}

const PRODUCTION_LINES: ProductionLine[] = ["Line 1", "Line 2", "Line 3", "Line 4"];
const ORDER_STATUSES: OrderStatus[] = [
  "draft",
  "released",
  "in_progress",
  "completed",
  "on_hold",
  "overdue",
];

const EMPTY_FORM = {
  name: "",
  quantity: "",
  producedQty: "0",
  scheduledDate: "",
  dueDate: "",
  line: "Line 1" as ProductionLine,
  bomVersion: "",
  status: "draft" as OrderStatus,
};

export function OrderFormDialog({ order, onSaved, trigger }: OrderFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setForm(
        order
          ? {
              name: order.name,
              quantity: String(order.quantity),
              producedQty: String(order.producedQty),
              scheduledDate: order.scheduledDate,
              dueDate: order.dueDate,
              line: order.line,
              bomVersion: order.bomVersion,
              status: order.status,
            }
          : EMPTY_FORM
      );
      setError(null);
    }
    setOpen(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantity = Number(form.quantity);
    const producedQty = Number(form.producedQty);

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }
    if (!Number.isFinite(producedQty) || producedQty < 0 || producedQty > quantity) {
      setError("Produced quantity must be between 0 and the ordered quantity.");
      return;
    }
    if (!form.scheduledDate) {
      setError("Scheduled date is required.");
      return;
    }
    if (!form.dueDate) {
      setError("Due date is required.");
      return;
    }
    if (!form.bomVersion.trim()) {
      setError("BOM version is required.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        quantity,
        producedQty,
        scheduledDate: form.scheduledDate,
        dueDate: form.dueDate,
        line: form.line,
        bomVersion: form.bomVersion.trim(),
        status: form.status,
      };

      if (order) {
        updateOrder(order.id, payload);
        toast.success("Order updated");
      } else {
        createOrder(payload);
        toast.success("Order created");
      }
      setOpen(false);
      onSaved();
    } catch {
      toast.error("Could not save the order. Storage may be unavailable.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{order ? "Edit order" : "New order"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="order-name">Name</Label>
            <Input
              id="order-name"
              value={form.name}
              onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order-quantity">Quantity</Label>
              <Input
                id="order-quantity"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(event) => setForm((f) => ({ ...f, quantity: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-produced">Produced qty</Label>
              <Input
                id="order-produced"
                type="number"
                min={0}
                value={form.producedQty}
                onChange={(event) => setForm((f) => ({ ...f, producedQty: event.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order-date">Scheduled date</Label>
              <Input
                id="order-date"
                type="date"
                value={form.scheduledDate}
                onChange={(event) => setForm((f) => ({ ...f, scheduledDate: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-due-date">Due date</Label>
              <Input
                id="order-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((f) => ({ ...f, dueDate: event.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order-line">Line</Label>
              <Select
                value={form.line}
                onValueChange={(value) => setForm((f) => ({ ...f, line: value as ProductionLine }))}
              >
                <SelectTrigger id="order-line">
                  <SelectValue>{(value: ProductionLine | null) => value ?? ""}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTION_LINES.map((line) => (
                    <SelectItem key={line} value={line}>
                      {line}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-bom">BOM version</Label>
              <Input
                id="order-bom"
                placeholder="v1.0"
                value={form.bomVersion}
                onChange={(event) => setForm((f) => ({ ...f, bomVersion: event.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm((f) => ({ ...f, status: value as OrderStatus }))}
            >
              <SelectTrigger id="order-status">
                <SelectValue>
                  {(value: OrderStatus | null) => (value ? ORDER_STATUS_LABELS[value] : "")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit">{order ? "Save changes" : "Create order"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Fix the one status-literal reference in `lib/traceability.ts`**

In `generateBuildRecord`, find this line:

```ts
    shipped: order.status === "done",
```

Replace it with:

```ts
    shipped: order.status === "completed",
```

No other line in `lib/traceability.ts` references order status literals.

- [ ] **Step 6: Replace `lib/__tests__/orders.test.ts` in full**

```ts
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
```

- [ ] **Step 7: Replace `lib/__tests__/traceability.test.ts` in full**

Every `createOrder(...)` call in this file used the old 3-field-plus-status shape with `status: "done"`. Replace the whole file with this version, which adds a `makeOrderInput` helper and updates every call site (test *behavior* is unchanged — same order names, quantities, and dates as before, just via the helper and with `status: "completed"` instead of `"done"`):

```ts
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
```

- [ ] **Step 8: Run the full test suite and confirm it passes**

Run: `npm run test`
Expected: all suites PASS (`auth`, `orders`, `traceability`, `traceability-export`).

- [ ] **Step 9: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add lib/types.ts lib/order-status.ts lib/orders.ts components/dashboard/order-form-dialog.tsx lib/traceability.ts lib/__tests__/orders.test.ts lib/__tests__/traceability.test.ts
git commit -m "Migrate OrderStatus to 6 states and extend ProductionOrder for the Production module"
```

---

### Task 2: Trace Score computation

**Files:**
- Create: `lib/production.ts`
- Create: `lib/__tests__/production.test.ts`

**Interfaces:**
- Consumes: `getBuildRecords` from `@/lib/traceability`; `ProductionOrder` from `@/lib/types`.
- Produces: `interface TraceScore { percent: number; band: "green" | "amber" | "red" }`, `getTraceScore(order: ProductionOrder): TraceScore | null`, `formatWorkOrderId(order: ProductionOrder): string`.

- [ ] **Step 1: Create `lib/production.ts`**

```ts
import { getBuildRecords } from "@/lib/traceability";
import type { ProductionOrder } from "@/lib/types";

export interface TraceScore {
  percent: number;
  band: "green" | "amber" | "red";
}

export function getTraceScore(order: ProductionOrder): TraceScore | null {
  if (order.producedQty <= 0) return null;

  const builds = getBuildRecords().filter((b) => b.orderId === order.id);
  if (builds.length === 0) return null;

  const passing = builds.filter(
    (b) => b.designCheckPass && b.supplierCheckPass && b.qcResult !== "fail"
  ).length;
  const percent = Math.round((passing / builds.length) * 100);

  const band: TraceScore["band"] = percent >= 95 ? "green" : percent >= 70 ? "amber" : "red";

  return { percent, band };
}

export function formatWorkOrderId(order: ProductionOrder): string {
  return `WO-${order.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
```

- [ ] **Step 2: Create `lib/__tests__/production.test.ts`**

```ts
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
```

- [ ] **Step 3: Run the tests and confirm they pass**

Run: `npm run test -- run lib/__tests__/production.test.ts`
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/production.ts lib/__tests__/production.test.ts
git commit -m "Add Trace Score computation for Production module"
```

---

### Task 3: Constraints

**Files:**
- Modify: `lib/traceability.ts`
- Modify: `lib/production.ts`
- Create: `lib/production-status.ts`
- Modify: `lib/__tests__/production.test.ts`

**Interfaces:**
- Consumes: `getOrders` from `@/lib/orders`.
- Produces: `Constraint`, `ConstraintType`, `ConstraintSeverity`, `ConstraintStatus` (in `lib/types.ts`); `getConstraints(): Constraint[]`; `CONSTRAINT_TYPE_LABELS`, `CONSTRAINT_SEVERITY_CLASSES`, `CONSTRAINT_STATUS_CLASSES` (in `lib/production-status.ts`).

- [ ] **Step 1: Export the three deterministic-RNG helpers from `lib/traceability.ts`**

Find these three function declarations (currently unexported, near the top of the file):

```ts
function hashString(value: string): number {
```
```ts
function mulberry32(seed: number): () => number {
```
```ts
function pick<T>(items: T[], rand: () => number): T {
```

Add the `export` keyword to each (`export function hashString(...)`, `export function mulberry32(...)`, `export function pick<T>(...)`). Do not change their implementations.

- [ ] **Step 2: Add `Constraint` types to `lib/types.ts`**

Append to the end of the file:

```ts
export type ConstraintType =
  | "material_shortage"
  | "machine_maintenance"
  | "capacity_overload"
  | "labour_shortage"
  | "quality_hold"
  | "utility_outage";

export type ConstraintSeverity = "high" | "medium" | "low";
export type ConstraintStatus = "open" | "mitigated" | "scheduled" | "resolved";

export interface Constraint {
  id: string;
  type: ConstraintType;
  resource: string;
  impact: string;
  severity: ConstraintSeverity;
  date: string; // ISO date
  resolution: string;
  status: ConstraintStatus;
  owner: string;
  orderId?: string;
}
```

- [ ] **Step 3: Create `lib/production-status.ts`**

```ts
import type { ConstraintSeverity, ConstraintStatus, ConstraintType } from "@/lib/types";

export const CONSTRAINT_TYPE_LABELS: Record<ConstraintType, string> = {
  material_shortage: "Material Shortage",
  machine_maintenance: "Machine Maintenance",
  capacity_overload: "Capacity Overload",
  labour_shortage: "Labour Shortage",
  quality_hold: "Quality Hold",
  utility_outage: "Utility Outage",
};

export const CONSTRAINT_SEVERITY_CLASSES: Record<ConstraintSeverity, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-muted text-muted-foreground",
};

export const CONSTRAINT_STATUS_CLASSES: Record<ConstraintStatus, string> = {
  open: "bg-destructive/15 text-destructive",
  mitigated: "bg-amber-100 text-amber-800",
  scheduled: "bg-primary-100 text-primary-800",
  resolved: "bg-primary-600 text-white",
};
```

- [ ] **Step 4: Append to `lib/production.ts`**

Add this import at the top of the file (merge with the existing import block):

```ts
import { getOrders } from "@/lib/orders";
import { getBuildRecords, hashString, mulberry32, pick } from "@/lib/traceability";
import type { Constraint, ConstraintStatus, ConstraintType, ProductionOrder } from "@/lib/types";
```

(`getBuildRecords` was already imported for Task 2 — merge these into one import from `@/lib/traceability` rather than two separate import statements.)

Append to the end of the file:

```ts
const PLANT_STAFF = ["Priya S.", "Karthik R.", "Suresh P.", "Anita D.", "Ramesh T.", "Mohan K."];

const FLAVOR_CONSTRAINTS: Array<{
  type: ConstraintType;
  resource: string;
  impact: string;
  resolution: string;
}> = [
  {
    type: "machine_maintenance",
    resource: "Line 2 — Filling Machine",
    impact: "Scheduled downtime, 06:00–08:00",
    resolution: "Preventive maintenance window confirmed",
  },
  {
    type: "labour_shortage",
    resource: "Night shift — plant floor",
    impact: "Reduced throughput on affected line",
    resolution: "Cross-trained operators reassigned",
  },
  {
    type: "utility_outage",
    resource: "Boiler #2 — Steam supply",
    impact: "Mixing operations delayed",
    resolution: "Backup boiler commissioned",
  },
];

function orderConstraint(order: ProductionOrder, index: number): Constraint | null {
  const rand = mulberry32(hashString(`constraint-${order.id}`));

  if (order.status === "on_hold") {
    return {
      id: `C-${String(index).padStart(3, "0")}`,
      type: pick(["material_shortage", "quality_hold"] as ConstraintType[], rand),
      resource: order.name,
      impact: `${order.name} — production on hold`,
      severity: "high",
      date: order.scheduledDate,
      resolution: "Under review — awaiting resolution",
      status: "open",
      owner: pick(PLANT_STAFF, rand),
      orderId: order.id,
    };
  }

  if (order.status === "overdue") {
    return {
      id: `C-${String(index).padStart(3, "0")}`,
      type: "capacity_overload",
      resource: order.line,
      impact: `${order.name} — past due date`,
      severity: "medium",
      date: order.dueDate,
      resolution: `Reschedule or expedite on ${order.line}`,
      status: "open",
      owner: pick(PLANT_STAFF, rand),
      orderId: order.id,
    };
  }

  return null;
}

export function getConstraints(): Constraint[] {
  const constraints: Constraint[] = [];

  getOrders().forEach((order) => {
    const constraint = orderConstraint(order, constraints.length + 1);
    if (constraint) constraints.push(constraint);
  });

  FLAVOR_CONSTRAINTS.forEach((flavor, i) => {
    const rand = mulberry32(hashString(`flavor-constraint-${i}`));
    const statusPool: ConstraintStatus[] = ["mitigated", "scheduled", "resolved"];
    constraints.push({
      id: `C-${String(constraints.length + 1).padStart(3, "0")}`,
      type: flavor.type,
      resource: flavor.resource,
      impact: flavor.impact,
      severity: "low",
      date: new Date().toISOString().slice(0, 10),
      resolution: flavor.resolution,
      status: pick(statusPool, rand),
      owner: pick(PLANT_STAFF, rand),
    });
  });

  return constraints;
}
```

- [ ] **Step 5: Append to `lib/__tests__/production.test.ts`**

Add `getConstraints` to the existing import from `@/lib/production`. Append:

```ts
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
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npm run test -- run lib/__tests__/production.test.ts`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/traceability.ts lib/types.ts lib/production-status.ts lib/production.ts lib/__tests__/production.test.ts
git commit -m "Add Constraints data layer for Production module"
```

---

### Task 4: Schedule Updates

**Files:**
- Modify: `lib/production.ts`
- Modify: `lib/production-status.ts`
- Modify: `lib/__tests__/production.test.ts`

**Interfaces:**
- Consumes: `getBuildRecords`, `getLots`, `getSuppliers` from `@/lib/traceability`; `getOrders` from `@/lib/orders`.
- Produces: `ScheduleUpdate`, `ScheduleUpdateType` (in `lib/types.ts`); `getScheduleUpdates(): ScheduleUpdate[]`, `formatRelativeTime(minutesAgo: number): string`; `SCHEDULE_UPDATE_TYPE_LABELS`, `SCHEDULE_UPDATE_TYPE_CLASSES` (in `lib/production-status.ts`).

- [ ] **Step 1: Add `ScheduleUpdate` types to `lib/types.ts`**

Append to the end of the file:

```ts
export type ScheduleUpdateType =
  | "production_start"
  | "completion"
  | "quantity_update"
  | "delay_alert"
  | "qc_passed"
  | "material_receipt";

export interface ScheduleUpdate {
  id: string;
  type: ScheduleUpdateType;
  description: string;
  minutesAgo: number;
  actor: string;
  orderId?: string;
}
```

- [ ] **Step 2: Append to `lib/production-status.ts`**

Add `ScheduleUpdateType` to the existing type import. Append:

```ts
export const SCHEDULE_UPDATE_TYPE_LABELS: Record<ScheduleUpdateType, string> = {
  production_start: "Production Start",
  completion: "Completion",
  quantity_update: "Quantity Update",
  delay_alert: "Delay Alert",
  qc_passed: "QC Passed",
  material_receipt: "Material Receipt",
};

export const SCHEDULE_UPDATE_TYPE_CLASSES: Record<ScheduleUpdateType, string> = {
  production_start: "bg-primary-100 text-primary-800",
  completion: "bg-primary-600 text-white",
  quantity_update: "bg-muted text-muted-foreground",
  delay_alert: "bg-destructive/15 text-destructive",
  qc_passed: "bg-primary-600 text-white",
  material_receipt: "bg-primary-100 text-primary-800",
};
```

- [ ] **Step 3: Append to `lib/production.ts`**

Update the import from `@/lib/traceability` to include `getLots` and `getSuppliers` alongside the existing `getBuildRecords`, `hashString`, `mulberry32`, `pick`.

Append to the end of the file:

```ts
export function formatRelativeTime(minutesAgo: number): string {
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  const hours = Math.round((minutesAgo / 60) * 2) / 2;
  return `${hours} hr ago`;
}

export function getScheduleUpdates(): ScheduleUpdate[] {
  const updates: ScheduleUpdate[] = [];

  getOrders().forEach((order) => {
    const rand = mulberry32(hashString(`update-${order.id}`));

    if (order.status === "in_progress" || order.status === "completed") {
      updates.push({
        id: `U-${order.id}-start`,
        type: "production_start",
        description: `${order.name} — ${order.line} started batch production`,
        minutesAgo: Math.round(30 + rand() * 200),
        actor: "System",
        orderId: order.id,
      });
    }

    if (order.status === "completed") {
      updates.push({
        id: `U-${order.id}-complete`,
        type: "completion",
        description: `${order.name} — ${order.producedQty} units completed, sent to QC`,
        minutesAgo: Math.round(5 + rand() * 60),
        actor: pick(PLANT_STAFF, rand),
        orderId: order.id,
      });
    } else if (order.producedQty > 0) {
      const pct = Math.round((order.producedQty / order.quantity) * 100);
      updates.push({
        id: `U-${order.id}-qty`,
        type: "quantity_update",
        description: `${order.name} — produced ${order.producedQty} of ${order.quantity} (${pct}%)`,
        minutesAgo: Math.round(10 + rand() * 90),
        actor: "System",
        orderId: order.id,
      });
    }

    if (order.status === "on_hold") {
      updates.push({
        id: `U-${order.id}-delay`,
        type: "delay_alert",
        description: `${order.name} delayed — on hold`,
        minutesAgo: Math.round(5 + rand() * 40),
        actor: "System",
        orderId: order.id,
      });
    }
  });

  getBuildRecords().forEach((build) => {
    const rand = mulberry32(hashString(`update-build-${build.serial}`));

    if (build.qcResult === "fail") {
      updates.push({
        id: `U-${build.serial}-delay`,
        type: "delay_alert",
        description: `${build.serial} — ${build.supplierCheckNote ?? "QC issue detected"}`,
        minutesAgo: Math.round(2 + rand() * 30),
        actor: "QC Lab",
        orderId: build.orderId,
      });
    } else {
      updates.push({
        id: `U-${build.serial}-qc`,
        type: "qc_passed",
        description: `Batch ${build.serial} — all quality parameters within specification`,
        minutesAgo: Math.round(15 + rand() * 120),
        actor: "QC Lab",
        orderId: build.orderId,
      });
    }
  });

  getLots()
    .slice(0, 3)
    .forEach((lot, i) => {
      const rand = mulberry32(hashString(`update-lot-${lot.lotNumber}`));
      const supplier = getSuppliers().find((s) => s.id === lot.supplierId);
      updates.push({
        id: `U-lot-${lot.lotNumber}`,
        type: "material_receipt",
        description: `${lot.lotNumber} — ${lot.materialName} received from ${supplier?.name ?? "supplier"}`,
        minutesAgo: Math.round(60 + i * 45 + rand() * 60),
        actor: "Warehouse",
      });
    });

  return updates.sort((a, b) => a.minutesAgo - b.minutesAgo);
}
```

Note: `getScheduleUpdates` references `orderId?: build.orderId` when pushing entries for builds whose source order may have been deleted after seeding — this is expected and matches `ScheduleUpdate.orderId` being optional; consuming components must handle a missing match (see Task 10).

- [ ] **Step 4: Append to `lib/__tests__/production.test.ts`**

Update the import from `@/lib/production` to include `formatRelativeTime` and `getScheduleUpdates`. Append:

```ts
describe("getScheduleUpdates", () => {
  it("is deterministic and idempotent given the same source data", () => {
    createOrder({ ...ORDER_INPUT, status: "in_progress" });
    const first = getScheduleUpdates();
    const second = getScheduleUpdates();
    expect(second).toEqual(first);
  });

  it("sorts entries from most to least recent", () => {
    createOrder({ ...ORDER_INPUT, status: "completed" });
    const updates = getScheduleUpdates();
    const minutes = updates.map((u) => u.minutesAgo);
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
  });

  it("only references orders that currently exist", () => {
    createOrder({ ...ORDER_INPUT, status: "in_progress" });
    const orderIds = new Set(getOrders().map((o) => o.id));
    getScheduleUpdates().forEach((u) => {
      if (u.orderId) expect(orderIds.has(u.orderId)).toBe(true);
    });
  });

  it("produces a production-start entry for in-progress orders", () => {
    const order = createOrder({ ...ORDER_INPUT, status: "in_progress" });
    const updates = getScheduleUpdates();
    expect(
      updates.some((u) => u.orderId === order.id && u.type === "production_start")
    ).toBe(true);
  });
});

describe("formatRelativeTime", () => {
  it("formats under an hour in minutes", () => {
    expect(formatRelativeTime(45)).toBe("45 min ago");
  });

  it("formats an hour or more in hours", () => {
    expect(formatRelativeTime(90)).toBe("1.5 hr ago");
    expect(formatRelativeTime(120)).toBe("2 hr ago");
  });
});
```

This task's tests need `getOrders` in scope — it's already imported for other tests in the same file (add it to the existing `@/lib/orders` import if not already present from Task 1/2/3's edits).

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npm run test -- run lib/__tests__/production.test.ts`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/production-status.ts lib/production.ts lib/__tests__/production.test.ts
git commit -m "Add Schedule Updates activity feed for Production module"
```

---

### Task 5: Trace Score badge component

**Files:**
- Create: `components/dashboard/production/trace-score-badge.tsx`

**Interfaces:**
- Consumes: `getTraceScore` from `@/lib/production`; `ProductionOrder` from `@/lib/types`.
- Produces: `<TraceScoreBadge order={ProductionOrder} />`.

- [ ] **Step 1: Create `components/dashboard/production/trace-score-badge.tsx`**

```tsx
import { getTraceScore } from "@/lib/production";
import type { ProductionOrder } from "@/lib/types";

const BAND_CLASSES: Record<"green" | "amber" | "red", string> = {
  green: "bg-primary-500",
  amber: "bg-amber-500",
  red: "bg-destructive",
};

export function TraceScoreBadge({ order }: { order: ProductionOrder }) {
  const score = getTraceScore(order);
  if (!score) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full ${BAND_CLASSES[score.band]}`}
          style={{ width: `${score.percent}%` }}
        />
      </div>
      <span className="text-xs font-medium">{score.percent}%</span>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/production/trace-score-badge.tsx
git commit -m "Add Trace Score badge component"
```

---

### Task 6: Work Order rows table

**Files:**
- Create: `components/dashboard/production/work-order-rows.tsx`

**Interfaces:**
- Consumes: `formatWorkOrderId` from `@/lib/production`; `OrderStatusBadge` from `@/components/dashboard/order-status-badge` (existing); `TraceScoreBadge` from Task 5; `ProductionOrder` from `@/lib/types`.
- Produces: `<WorkOrderRows orders={ProductionOrder[]} />`.

- [ ] **Step 1: Create `components/dashboard/production/work-order-rows.tsx`**

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { TraceScoreBadge } from "@/components/dashboard/production/trace-score-badge";
import { formatWorkOrderId } from "@/lib/production";
import type { ProductionOrder } from "@/lib/types";

interface WorkOrderRowsProps {
  orders: ProductionOrder[];
}

export function WorkOrderRows({ orders }: WorkOrderRowsProps) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">No work orders match this view.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Work Order</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Ordered</TableHead>
          <TableHead>Produced</TableHead>
          <TableHead>BOM</TableHead>
          <TableHead>Scheduled</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Line</TableHead>
          <TableHead>Trace %</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-mono text-xs">{formatWorkOrderId(order)}</TableCell>
            <TableCell>{order.name}</TableCell>
            <TableCell>{order.quantity.toLocaleString()}</TableCell>
            <TableCell>{order.producedQty.toLocaleString()}</TableCell>
            <TableCell>{order.bomVersion}</TableCell>
            <TableCell>{order.scheduledDate}</TableCell>
            <TableCell>{order.dueDate}</TableCell>
            <TableCell>{order.line}</TableCell>
            <TableCell>
              <TraceScoreBadge order={order} />
            </TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/production/work-order-rows.tsx
git commit -m "Add Work Order rows table component"
```

---

### Task 7: Work Orders tab (status-filtered table)

**Files:**
- Create: `components/dashboard/production/work-order-table.tsx`

**Interfaces:**
- Consumes: `WorkOrderRows` from Task 6; `cn` from `@/lib/utils` (existing); `OrderStatus`, `ProductionOrder` from `@/lib/types`.
- Produces: `<WorkOrderTable orders={ProductionOrder[]} />`.

- [ ] **Step 1: Create `components/dashboard/production/work-order-table.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { WorkOrderRows } from "@/components/dashboard/production/work-order-rows";
import { cn } from "@/lib/utils";
import type { OrderStatus, ProductionOrder } from "@/lib/types";

const STATUS_TABS: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "released", label: "Released" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "overdue", label: "Overdue" },
];

interface WorkOrderTableProps {
  orders: ProductionOrder[];
}

export function WorkOrderTable({ orders }: WorkOrderTableProps) {
  const [activeStatus, setActiveStatus] = useState<OrderStatus | "all">("all");

  const counts = useMemo(() => {
    const base: Record<OrderStatus | "all", number> = {
      all: orders.length,
      draft: 0,
      released: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0,
      overdue: 0,
    };
    for (const order of orders) {
      base[order.status] += 1;
    }
    return base;
  }, [orders]);

  const filtered = activeStatus === "all" ? orders : orders.filter((o) => o.status === activeStatus);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveStatus(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeStatus === tab.value
                ? "bg-primary-100 text-primary-800"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label} ({counts[tab.value]})
          </button>
        ))}
      </div>
      <WorkOrderRows orders={filtered} />
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/production/work-order-table.tsx
git commit -m "Add Work Orders tab with status filtering"
```

---

### Task 8: Production Schedule tab (Gantt + List + active constraints panel)

**Files:**
- Create: `components/dashboard/production/schedule-gantt.tsx`
- Create: `components/dashboard/production/active-constraints-panel.tsx`

**Interfaces:**
- Consumes: `WorkOrderRows` from Task 6; `getConstraints` from `@/lib/production` (Task 3); `CONSTRAINT_SEVERITY_CLASSES`, `CONSTRAINT_TYPE_LABELS` from `@/lib/production-status` (Task 3); `ORDER_STATUS_CLASSES` from `@/lib/order-status` (existing); `Button` from `@/components/ui/button` (existing).
- Produces: `<ScheduleGantt orders={ProductionOrder[]} />`, `<ActiveConstraintsPanel />`.

- [ ] **Step 1: Create `components/dashboard/production/active-constraints-panel.tsx`**

```tsx
import { getConstraints } from "@/lib/production";
import { CONSTRAINT_SEVERITY_CLASSES, CONSTRAINT_TYPE_LABELS } from "@/lib/production-status";

export function ActiveConstraintsPanel() {
  const constraints = getConstraints()
    .filter((c) => c.status === "open" || c.status === "scheduled")
    .slice(0, 3);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Active Constraints ({constraints.length})</p>
      {constraints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active constraints.</p>
      ) : (
        constraints.map((c) => (
          <div key={c.id} className="space-y-1 border-t pt-3 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{CONSTRAINT_TYPE_LABELS[c.type]}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${CONSTRAINT_SEVERITY_CLASSES[c.severity]}`}
              >
                {c.severity}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{c.impact}</p>
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `components/dashboard/production/schedule-gantt.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { ActiveConstraintsPanel } from "@/components/dashboard/production/active-constraints-panel";
import { WorkOrderRows } from "@/components/dashboard/production/work-order-rows";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_CLASSES } from "@/lib/order-status";
import type { ProductionLine, ProductionOrder } from "@/lib/types";

const LINES: ProductionLine[] = ["Line 1", "Line 2", "Line 3", "Line 4"];
const WINDOW_DAYS = 7;

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function dayOffset(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShort(date: Date): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

interface ScheduleGanttProps {
  orders: ProductionOrder[];
}

export function ScheduleGantt({ orders }: ScheduleGanttProps) {
  const [view, setView] = useState<"gantt" | "list">("gantt");

  const windowStart = useMemo(() => {
    const today = new Date(new Date().toDateString());
    if (orders.length === 0) return today;
    const earliest = orders.reduce(
      (min, o) => (toDate(o.scheduledDate) < min ? toDate(o.scheduledDate) : min),
      toDate(orders[0].scheduledDate)
    );
    return earliest < today ? earliest : today;
  }, [orders]);

  const days = useMemo(
    () =>
      Array.from({ length: WINDOW_DAYS }, (_, i) => {
        const d = new Date(windowStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [windowStart]
  );

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">No production orders yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Last updated just now</p>
        <div className="flex gap-2">
          <Button size="sm" variant={view === "gantt" ? undefined : "outline"} onClick={() => setView("gantt")}>
            Gantt
          </Button>
          <Button size="sm" variant={view === "list" ? undefined : "outline"} onClick={() => setView("list")}>
            List
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <WorkOrderRows
          orders={[...orders].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))}
        />
      ) : (
        <div className="grid grid-cols-[1fr_260px] gap-4">
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0" />
              <div className="grid flex-1 grid-cols-7 gap-1 text-xs text-muted-foreground">
                {days.map((d) => (
                  <span key={d.toISOString()}>{formatShort(d)}</span>
                ))}
              </div>
            </div>
            {LINES.map((line) => (
              <div key={line} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                  {line}
                </span>
                <div className="grid flex-1 grid-cols-7 gap-1">
                  {orders
                    .filter((o) => o.line === line)
                    .map((order) => {
                      const startOffset = Math.max(
                        0,
                        dayOffset(windowStart, toDate(order.scheduledDate))
                      );
                      const endOffset = Math.min(
                        WINDOW_DAYS - 1,
                        dayOffset(windowStart, toDate(order.dueDate))
                      );
                      if (endOffset < 0 || startOffset >= WINDOW_DAYS) return null;
                      const span = Math.max(1, endOffset - startOffset + 1);
                      return (
                        <div
                          key={order.id}
                          className={`truncate rounded px-2 py-1 text-xs ${ORDER_STATUS_CLASSES[order.status]}`}
                          style={{ gridColumn: `${startOffset + 1} / span ${span}` }}
                          title={order.name}
                        >
                          {order.name}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
          <ActiveConstraintsPanel />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/production/schedule-gantt.tsx components/dashboard/production/active-constraints-panel.tsx
git commit -m "Add Production Schedule tab (Gantt/List + active constraints panel)"
```

---

### Task 9: Constraints tab

**Files:**
- Create: `components/dashboard/production/constraints-table.tsx`

**Interfaces:**
- Consumes: `getConstraints` from `@/lib/production` (Task 3); `CONSTRAINT_SEVERITY_CLASSES`, `CONSTRAINT_STATUS_CLASSES`, `CONSTRAINT_TYPE_LABELS` from `@/lib/production-status` (Task 3).
- Produces: `<ConstraintsTable />`.

- [ ] **Step 1: Create `components/dashboard/production/constraints-table.tsx`**

```tsx
"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getConstraints } from "@/lib/production";
import {
  CONSTRAINT_SEVERITY_CLASSES,
  CONSTRAINT_STATUS_CLASSES,
  CONSTRAINT_TYPE_LABELS,
} from "@/lib/production-status";

export function ConstraintsTable() {
  const constraints = useMemo(getConstraints, []);

  const counts = useMemo(
    () => ({
      open: constraints.filter((c) => c.status === "open").length,
      mitigated: constraints.filter((c) => c.status === "mitigated").length,
      scheduled: constraints.filter((c) => c.status === "scheduled").length,
      resolved: constraints.filter((c) => c.status === "resolved").length,
    }),
    [constraints]
  );

  if (constraints.length === 0) {
    return <p className="text-sm text-muted-foreground">No constraints recorded.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <span>
          Open: <strong>{counts.open}</strong>
        </span>
        <span>
          Mitigated: <strong>{counts.mitigated}</strong>
        </span>
        <span>
          Scheduled: <strong>{counts.scheduled}</strong>
        </span>
        <span>
          Resolved: <strong>{counts.resolved}</strong>
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Impact</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Resolution</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {constraints.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-mono text-xs">{c.id}</TableCell>
              <TableCell>{CONSTRAINT_TYPE_LABELS[c.type]}</TableCell>
              <TableCell>{c.resource}</TableCell>
              <TableCell className="max-w-xs truncate" title={c.impact}>
                {c.impact}
              </TableCell>
              <TableCell>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs ${CONSTRAINT_SEVERITY_CLASSES[c.severity]}`}
                >
                  {c.severity}
                </span>
              </TableCell>
              <TableCell>{c.date}</TableCell>
              <TableCell className="max-w-xs truncate" title={c.resolution}>
                {c.resolution}
              </TableCell>
              <TableCell>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs ${CONSTRAINT_STATUS_CLASSES[c.status]}`}
                >
                  {c.status}
                </span>
              </TableCell>
              <TableCell>{c.owner}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/production/constraints-table.tsx
git commit -m "Add Constraints tab"
```

---

### Task 10: Schedule Updates tab

**Files:**
- Create: `components/dashboard/production/schedule-updates-feed.tsx`

**Interfaces:**
- Consumes: `getScheduleUpdates`, `formatRelativeTime`, `formatWorkOrderId` from `@/lib/production` (Tasks 2/4); `getOrders` from `@/lib/orders`; `SCHEDULE_UPDATE_TYPE_CLASSES`, `SCHEDULE_UPDATE_TYPE_LABELS` from `@/lib/production-status` (Task 4); `Button` from `@/components/ui/button` (existing).
- Produces: `<ScheduleUpdatesFeed />`.

- [ ] **Step 1: Create `components/dashboard/production/schedule-updates-feed.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/orders";
import { formatRelativeTime, formatWorkOrderId, getScheduleUpdates } from "@/lib/production";
import { SCHEDULE_UPDATE_TYPE_CLASSES, SCHEDULE_UPDATE_TYPE_LABELS } from "@/lib/production-status";

export function ScheduleUpdatesFeed() {
  const [refreshKey, setRefreshKey] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey intentionally re-triggers a fresh read
  const updates = useMemo(() => getScheduleUpdates(), [refreshKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey intentionally re-triggers a fresh read
  const orders = useMemo(() => getOrders(), [refreshKey]);

  if (updates.length === 0) {
    return <p className="text-sm text-muted-foreground">No schedule updates yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary-500" /> Live
        </span>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
          Refresh
        </Button>
      </div>
      <ul className="space-y-3">
        {updates.map((u) => {
          const order = orders.find((o) => o.id === u.orderId);
          return (
            <li key={u.id} className="space-y-1 border-b pb-3 text-sm">
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-xs ${SCHEDULE_UPDATE_TYPE_CLASSES[u.type]}`}
              >
                {SCHEDULE_UPDATE_TYPE_LABELS[u.type]}
              </span>
              <p>{u.description}</p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(u.minutesAgo)} · by {u.actor}
                {order && <> · {formatWorkOrderId(order)}</>}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/production/schedule-updates-feed.tsx
git commit -m "Add Schedule Updates tab"
```

---

### Task 11: Nav integration

**Files:**
- Modify: `components/dashboard/dashboard-nav.tsx`

**Interfaces:**
- No new interfaces — one-line addition to the existing `NAV_LINKS` array.

- [ ] **Step 1: Add the Production link to `NAV_LINKS`**

In `components/dashboard/dashboard-nav.tsx`, find:

```ts
const NAV_LINKS = [
  { href: "/dashboard", label: "Orders" },
  { href: "/dashboard/traceability", label: "Traceability" },
];
```

Replace with:

```ts
const NAV_LINKS = [
  { href: "/dashboard", label: "Orders" },
  { href: "/dashboard/production", label: "Production" },
  { href: "/dashboard/traceability", label: "Traceability" },
];
```

No other change to this file — the alert-count badge logic already only checks `link.label === "Traceability"`, so Production correctly gets no badge.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/dashboard-nav.tsx
git commit -m "Add Production link to dashboard nav"
```

---

### Task 12: Production page — wire it all together, verify end-to-end, open PR

**Files:**
- Create: `app/dashboard/production/page.tsx`

**Interfaces:**
- Consumes: `ensureTraceabilitySeeded` from `@/lib/traceability` (existing); `getOrders` from `@/lib/orders`; `ScheduleGantt` (Task 8), `WorkOrderTable` (Task 7), `ConstraintsTable` (Task 9), `ScheduleUpdatesFeed` (Task 10); `Tabs`/`TabsContent`/`TabsList`/`TabsTrigger` from `@/components/ui/tabs` (existing).

- [ ] **Step 1: Create `app/dashboard/production/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { getOrders } from "@/lib/orders";
import { ensureTraceabilitySeeded } from "@/lib/traceability";
import type { ProductionOrder } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleGantt } from "@/components/dashboard/production/schedule-gantt";
import { WorkOrderTable } from "@/components/dashboard/production/work-order-table";
import { ConstraintsTable } from "@/components/dashboard/production/constraints-table";
import { ScheduleUpdatesFeed } from "@/components/dashboard/production/schedule-updates-feed";

// Same rationale as app/dashboard/page.tsx and app/dashboard/traceability/page.tsx:
// this only ever renders on the client after DashboardLayout's auth-gated mount
// check, so seeding here is safe. ensureTraceabilitySeeded() also seeds orders,
// which Trace %/Constraints/Schedule Updates all depend on existing.
function loadOrders(): ProductionOrder[] {
  ensureTraceabilitySeeded();
  return getOrders();
}

export default function ProductionPage() {
  const [orders] = useState<ProductionOrder[]>(loadOrders);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Production</h1>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-4">
          <ScheduleGantt orders={orders} />
        </TabsContent>
        <TabsContent value="work-orders" className="mt-4">
          <WorkOrderTable orders={orders} />
        </TabsContent>
        <TabsContent value="constraints" className="mt-4">
          <ConstraintsTable />
        </TabsContent>
        <TabsContent value="updates" className="mt-4">
          <ScheduleUpdatesFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm run test`
Expected: all suites PASS (`auth`, `orders`, `traceability`, `traceability-export`, `production`).

- [ ] **Step 3: Type-check and lint the whole project**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Manual end-to-end verification in a browser**

Run `npm run dev` on a free port, then in a browser:
1. Log in with any `*@gmail.com` address and any password.
2. Confirm the top nav now shows **Orders**, **Production**, **Traceability** in that order.
3. Click **Production**. Confirm it lands on the **Schedule** tab: a 7-day Gantt with 4 line rows, order bars colored by status, and an "Active Constraints" panel on the right.
4. Click **List** — confirm it shows the same orders as a sorted table, then click **Gantt** to switch back.
5. Click **Work Orders** — confirm the status tabs (All/Draft/Released/In Progress/Completed/On Hold/Overdue) show correct counts and filter the table; confirm the Trace % column shows a colored bar for orders with produced units and build records, and a dash for orders with none.
6. Click **Constraints** — confirm the summary counts and table render, including at least one constraint linked to the seeded `on_hold` order.
7. Click **Updates** — confirm a reverse-chronological feed renders with type badges, descriptions, relative times, and work-order links; click **Refresh** and confirm it doesn't error.
8. Go to the **Orders** tab, open **New order** — confirm the dialog now has Quantity/Produced qty, Scheduled/Due date, Line, BOM version fields, and the Status dropdown offers all 6 states. Create one and confirm it appears correctly across List, Timeline, and the new Production tabs.
9. Confirm dark mode renders all new components legibly.

- [ ] **Step 5: Commit, push, and open a PR against `feature/bom-traceability`**

```bash
git add app/dashboard/production/page.tsx
git commit -m "Add Production page wiring Schedule, Work Orders, Constraints, and Updates tabs"
git push -u origin feature/production-module
```

Open a PR with `gh pr create --base feature/bom-traceability --head feature/production-module` (base is the Traceability branch, not `main`, since this branch depends on it and Traceability's own PR #3 is still open) — include a summary of what was built, the design/plan doc paths, and the test/verification results from Steps 2-4.
