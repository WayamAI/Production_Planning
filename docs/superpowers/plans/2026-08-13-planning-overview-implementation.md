# Planning Overview Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Planning Overview dashboard (the reference product's home page) — 15 KPI cards, 2 charts, 3 panels, an exceptions table, and quick actions — with every card that can be computed from real app data wired live, and every card whose source module doesn't exist yet backed by a clearly-marked, deterministic preview dataset.

**Architecture:** A new `lib/overview.ts` data layer with two families of getters — live (real, derived from `lib/orders.ts`/`lib/traceability.ts`/`lib/production.ts`) and mock (fixed constants, one function per future-module preview, each commented with the module that will replace it). Seven small presentational components assemble into one page under a new "Overview" nav entry placed first.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Vitest. No charting library — both charts are lightweight custom SVG/CSS, matching every other chart-like element already in this app (order timeline, traceability funnel, production Gantt).

## Global Constraints

- No backend, no new npm dependencies.
- Follow existing conventions: no persistence needed for mock data (nothing to save); real-data computations reuse already-hardened functions from `lib/orders.ts`/`lib/traceability.ts`/`lib/production.ts`.
- Every mock-data getter must have a code comment naming the future module that will replace it — never an unexplained magic constant.
- No automated tests for React components — this codebase only unit-tests `lib/`. Component tasks are verified via `npx tsc --noEmit` + `npm run lint`; the final integration task is verified in a real browser.
- Design spec: `docs/superpowers/specs/2026-08-13-planning-overview-design.md`.
- This branch (`feature/planning-overview`) forks from `feature/production-module` — depends on `lib/production.ts`'s `getTraceScore`.

---

### Task 1: Overview types + live metrics

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/overview.ts`
- Create: `lib/__tests__/overview.test.ts`

**Interfaces:**
- Consumes: `getOrders` from `@/lib/orders`; `getTraceScore` from `@/lib/production`; `getCriticalAlerts`, `getPopulationAtRisk` from `@/lib/traceability`.
- Produces: `OverviewMetric` type; `getLiveMetrics(): OverviewMetric[]`.

- [ ] **Step 1: Append to `lib/types.ts`**

```ts
export interface OverviewMetric {
  label: string;
  value: string;
  trend?: string;
  tone: "critical" | "warning" | "good";
}
```

- [ ] **Step 2: Create `lib/overview.ts`**

```ts
import { getOrders } from "@/lib/orders";
import { getTraceScore } from "@/lib/production";
import { getCriticalAlerts, getPopulationAtRisk } from "@/lib/traceability";
import type { OverviewMetric } from "@/lib/types";

function toneFor(value: number, goodAt: number, warningAt: number): OverviewMetric["tone"] {
  if (value >= goodAt) return "good";
  if (value >= warningAt) return "warning";
  return "critical";
}

export function getLiveMetrics(): OverviewMetric[] {
  const orders = getOrders();

  const pending = orders.filter((o) => o.status !== "completed");
  const pendingRisky = pending.some((o) => o.status === "on_hold" || o.status === "overdue");

  const scores = orders
    .map((o) => getTraceScore(o))
    .filter((s): s is NonNullable<ReturnType<typeof getTraceScore>> => s !== null);
  const traceCompleteness =
    scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.percent, 0) / scores.length) : 0;

  const alerts = getCriticalAlerts();

  const funnel = getPopulationAtRisk({});
  const recallAccuracy =
    funnel.shippedToField > 0
      ? Math.max(0, Math.min(100, Math.round(100 - (funnel.atRiskInField / funnel.shippedToField) * 100)))
      : 100;

  const completedOrders = orders.filter((o) => o.status === "completed");
  const onTimeCompleted = completedOrders.filter((o) => o.scheduledDate <= o.dueDate);
  const scheduleAdherence =
    completedOrders.length > 0 ? Math.round((onTimeCompleted.length / completedOrders.length) * 100) : 100;

  return [
    {
      label: "Pending Work Orders",
      value: `${pending.length}`,
      trend: pendingRisky ? "Needs attention" : "On track",
      tone: pendingRisky ? "warning" : "good",
    },
    {
      label: "Trace Completeness",
      value: `${traceCompleteness}%`,
      tone: toneFor(traceCompleteness, 90, 70),
    },
    {
      label: "Active Suspect Lots",
      value: `${alerts.length}`,
      trend: alerts.length > 0 ? `${alerts.length} open` : "None open",
      tone: alerts.length > 0 ? "critical" : "good",
    },
    {
      label: "Recall Accuracy",
      value: `${recallAccuracy}%`,
      trend: "Field containment",
      tone: toneFor(recallAccuracy, 95, 85),
    },
    {
      label: "Schedule Adherence",
      value: `${scheduleAdherence}%`,
      tone: toneFor(scheduleAdherence, 90, 75),
    },
  ];
}

export function getMockMetrics(): OverviewMetric[] {
  // Each of these belongs to a module not yet built in this decomposition.
  // Fixed, realistic constants — replace with a real computation when that
  // module lands. Never randomized: a stable demo is more useful than a
  // shifting one for something with no real source data yet.
  return [
    { label: "Materials at Risk", value: "14 SKUs", trend: "↑ from 9 last week", tone: "critical" }, // Inventory module
    { label: "Open Purchase Orders", value: "87", trend: "₹4.2 Cr value", tone: "warning" }, // Purchase module
    { label: "Inventory Health", value: "74 / 100", trend: "Below 80 target", tone: "warning" }, // Inventory module
    { label: "Plan Attainment", value: "94.2%", trend: "Planned vs actual", tone: "good" }, // Material Planning module
    { label: "Forecast Accuracy", value: "85.8%", trend: "WAPE 14.2%", tone: "good" }, // Demand & Forecasting module
    { label: "Order Fill Rate", value: "96.2%", trend: "Last 30 days", tone: "good" }, // Demand & Forecasting module
    { label: "Inventory Turns", value: "9.6x", trend: "38 days of inventory", tone: "good" }, // Inventory module
    { label: "Cash in Inventory", value: "₹6.84 Cr", trend: "-₹1.9L this plan", tone: "good" }, // Inventory module
    { label: "Active Scenarios", value: "2", trend: "15 open exceptions", tone: "warning" }, // Planning Scenarios module
  ];
}
```

- [ ] **Step 3: Create `lib/__tests__/overview.test.ts`**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createOrder } from "@/lib/orders";
import { getLiveMetrics, getMockMetrics } from "@/lib/overview";
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
  it("returns nine correctly-typed metrics", () => {
    const metrics = getMockMetrics();
    expect(metrics).toHaveLength(9);
    metrics.forEach((m) => {
      expect(typeof m.label).toBe("string");
      expect(typeof m.value).toBe("string");
      expect(["critical", "warning", "good"]).toContain(m.tone);
    });
  });
});
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm run test -- run lib/__tests__/overview.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/overview.ts lib/__tests__/overview.test.ts
git commit -m "Add Planning Overview live metrics"
```

---

### Task 2: Overview mock data + chart data getters

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/overview.ts`
- Modify: `lib/__tests__/overview.test.ts`

**Interfaces:**
- Consumes: `getBuildRecords` from `@/lib/traceability`.
- Produces: `StockExhaustionAlert`, `MissingScanException`, `MrpRunStatus` types; `getMrpRunStatus(): MrpRunStatus`, `getStockExhaustionAlerts(): StockExhaustionAlert[]`, `getMissingScanExceptions(): MissingScanException[]`, `getMaterialCoverageTrend(): { week: string; series: Record<string, number> }[]`, `getTraceCompletenessByLine(): { line: string; value: number }[]`.

- [ ] **Step 1: Append to `lib/types.ts`**

```ts
export interface StockExhaustionAlert {
  id: string;
  material: string;
  quantity: string;
  daysOfCoverage: number;
  action: "Raise PO" | "Review" | "Monitor";
}

export interface MissingScanException {
  id: string;
  workOrderCode: string;
  part: string;
  station: string;
  shift: "Shift A" | "Shift B" | "Shift C";
  date: string;
  resolved: boolean;
}

export interface MrpRunStatus {
  lastRun: string;
  durationSeconds: number;
  plannedOrders: number;
  exceptions: number;
}
```

- [ ] **Step 2: Append to `lib/overview.ts`**

Add `getBuildRecords` to the existing import from `@/lib/traceability`. Add `MissingScanException`, `MrpRunStatus`, `StockExhaustionAlert` to the existing type import from `@/lib/types`. Append:

```ts
export function getTraceCompletenessByLine(): { line: string; value: number }[] {
  const builds = getBuildRecords();
  const byLine = new Map<string, { pass: number; total: number }>();

  builds.forEach((b) => {
    const entry = byLine.get(b.workCentre) ?? { pass: 0, total: 0 };
    entry.total += 1;
    if (b.designCheckPass && b.supplierCheckPass && b.qcResult !== "fail") entry.pass += 1;
    byLine.set(b.workCentre, entry);
  });

  return Array.from(byLine.entries()).map(([line, { pass, total }]) => ({
    line,
    value: total > 0 ? Math.round((pass / total) * 100) : 0,
  }));
}

export function getMaterialCoverageTrend(): { week: string; series: Record<string, number> }[] {
  // Illustrative only — depends on the Inventory module, not yet built.
  const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
  const base: Record<string, number[]> = {
    "Stearic Acid": [8.5, 7.8, 7.1, 6.4, 5.6, 4.8, 4.1, 3.4],
    "HDPE Resin": [6.1, 5.9, 5.4, 5.0, 4.7, 4.2, 3.8, 3.9],
    "Fragrance Blend": [5.0, 4.6, 4.2, 3.9, 3.5, 3.1, 2.7, 3.0],
    "Titanium Dioxide": [3.2, 3.4, 3.0, 2.8, 2.5, 2.1, 1.9, 2.2],
  };
  return weeks.map((week, i) => ({
    week,
    series: Object.fromEntries(Object.entries(base).map(([material, values]) => [material, values[i]])),
  }));
}

export function getMrpRunStatus(): MrpRunStatus {
  // Illustrative only — depends on the Material Planning module, not yet built.
  return {
    lastRun: "2026-03-23T06:30:00",
    durationSeconds: 252,
    plannedOrders: 312,
    exceptions: 18,
  };
}

export function getStockExhaustionAlerts(): StockExhaustionAlert[] {
  // Illustrative only — depends on the Stock Exhaustion Alerts module, not yet built.
  return [
    { id: "SEA-1", material: "Stearic Acid", quantity: "180 kg", daysOfCoverage: 4.3, action: "Raise PO" },
    { id: "SEA-2", material: "Fragrance Blend FG-04", quantity: "22 L", daysOfCoverage: 3.7, action: "Raise PO" },
    { id: "SEA-3", material: "EDTA Disodium Salt", quantity: "95 kg", daysOfCoverage: 5.1, action: "Raise PO" },
    { id: "SEA-4", material: "Shrink Labels (Type B)", quantity: "1,200 pcs", daysOfCoverage: 6.2, action: "Raise PO" },
    { id: "SEA-5", material: "Titanium Dioxide", quantity: "640 kg", daysOfCoverage: 8.2, action: "Review" },
    { id: "SEA-6", material: "Foil Seals 5L", quantity: "3,400 pcs", daysOfCoverage: 9.1, action: "Review" },
    { id: "SEA-7", material: "Sodium Lauryl Sulphate", quantity: "520 kg", daysOfCoverage: 11.4, action: "Monitor" },
  ];
}

export function getMissingScanExceptions(): MissingScanException[] {
  // Illustrative only — depends on the Material Planning module, not yet built.
  return [
    { id: "MSE-1", workOrderCode: "WO-2026-0862", part: "RM-4023", station: "Mixing Station A", shift: "Shift A", date: "2026-03-18", resolved: false },
    { id: "MSE-2", workOrderCode: "WO-2026-0865", part: "PM-1001", station: "Filling Station B", shift: "Shift B", date: "2026-03-19", resolved: false },
    { id: "MSE-3", workOrderCode: "WO-2026-0870", part: "RM-8012", station: "Fragrance Addition", shift: "Shift A", date: "2026-03-20", resolved: false },
    { id: "MSE-4", workOrderCode: "WO-2026-0872", part: "RM-2087", station: "Mixing Station A", shift: "Shift B", date: "2026-03-20", resolved: true },
    { id: "MSE-5", workOrderCode: "WO-2026-0878", part: "RM-4023", station: "QC Sampling", shift: "Shift A", date: "2026-03-21", resolved: false },
    { id: "MSE-6", workOrderCode: "WO-2026-0880", part: "PM-1001", station: "Filling Station A", shift: "Shift C", date: "2026-03-22", resolved: false },
  ];
}
```

- [ ] **Step 3: Append to `lib/__tests__/overview.test.ts`**

Add `getMaterialCoverageTrend`, `getMissingScanExceptions`, `getMrpRunStatus`, `getStockExhaustionAlerts`, `getTraceCompletenessByLine` to the existing import from `@/lib/overview`. Append:

```ts
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
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm run test -- run lib/__tests__/overview.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/overview.ts lib/__tests__/overview.test.ts
git commit -m "Add Planning Overview mock previews and chart data getters"
```

---

### Task 3: Metric card component

**Files:**
- Create: `components/dashboard/overview/metric-card.tsx`

**Interfaces:**
- Consumes: `OverviewMetric` from `@/lib/types`.
- Produces: `<MetricCard metric={OverviewMetric} />`.

- [ ] **Step 1: Create `components/dashboard/overview/metric-card.tsx`**

```tsx
import type { OverviewMetric } from "@/lib/types";

const TONE_BORDER_CLASSES: Record<OverviewMetric["tone"], string> = {
  critical: "border-l-destructive",
  warning: "border-l-amber-500",
  good: "border-l-primary-500",
};

const TONE_TEXT_CLASSES: Record<OverviewMetric["tone"], string> = {
  critical: "text-destructive",
  warning: "text-amber-600",
  good: "text-primary-600",
};

export function MetricCard({ metric }: { metric: OverviewMetric }) {
  return (
    <div className={`space-y-1 rounded-lg border border-l-4 p-4 ${TONE_BORDER_CLASSES[metric.tone]}`}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{metric.label}</p>
      <p className="text-2xl font-semibold">{metric.value}</p>
      {metric.trend && <p className={`text-xs ${TONE_TEXT_CLASSES[metric.tone]}`}>{metric.trend}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/overview/metric-card.tsx
git commit -m "Add Planning Overview metric card component"
```

---

### Task 4: MRP run, stock exhaustion, and schedule preview panels

**Files:**
- Create: `components/dashboard/overview/mrp-run-panel.tsx`
- Create: `components/dashboard/overview/stock-exhaustion-panel.tsx`
- Create: `components/dashboard/overview/schedule-preview-panel.tsx`

**Interfaces:**
- Consumes: `getMrpRunStatus`, `getStockExhaustionAlerts` from `@/lib/overview` (Task 2); `ProductionOrder` from `@/lib/types`; `Button` from `@/components/ui/button`; `toast` from `sonner`.
- Produces: `<MrpRunPanel />`, `<StockExhaustionPanel />`, `<SchedulePreviewPanel orders={ProductionOrder[]} />`.

- [ ] **Step 1: Create `components/dashboard/overview/mrp-run-panel.tsx`**

```tsx
"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMrpRunStatus } from "@/lib/overview";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MrpRunPanel() {
  const status = getMrpRunStatus();

  function handleRerun() {
    toast.info(
      "MRP re-run isn't available in this preview yet — full MRP lands with the Material Planning module."
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">MRP Run Status</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last Run</span>
          <span>{formatDateTime(status.lastRun)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span>
            {Math.floor(status.durationSeconds / 60)}m {status.durationSeconds % 60}s
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Planned Orders</span>
          <span>{status.plannedOrders}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Exceptions</span>
          <span className="text-destructive">{status.exceptions}</span>
        </div>
      </div>
      <Button className="w-full" onClick={handleRerun}>
        Re-run MRP Now
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/dashboard/overview/stock-exhaustion-panel.tsx`**

```tsx
import { getStockExhaustionAlerts } from "@/lib/overview";

export function StockExhaustionPanel() {
  const alerts = getStockExhaustionAlerts();

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Stock Exhaustion Alerts</p>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between border-t pt-2 text-sm first:border-t-0 first:pt-0"
          >
            <div>
              <p className="font-medium">{alert.material}</p>
              <p className="text-xs text-muted-foreground">
                {alert.quantity} · {alert.daysOfCoverage}d
              </p>
            </div>
            <span className="text-xs font-medium text-primary-600">{alert.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/dashboard/overview/schedule-preview-panel.tsx`**

```tsx
import type { OrderStatus, ProductionOrder } from "@/lib/types";

const READY_DOT_CLASSES: Record<OrderStatus, string> = {
  draft: "bg-muted-foreground",
  released: "bg-amber-500",
  in_progress: "bg-primary-500",
  completed: "bg-primary-500",
  on_hold: "bg-amber-500",
  overdue: "bg-destructive",
};

function isWithinNextDays(dateIso: string, days: number): boolean {
  const today = new Date(new Date().toDateString());
  const target = new Date(`${dateIso}T00:00:00`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

export function SchedulePreviewPanel({ orders }: { orders: ProductionOrder[] }) {
  const upcoming = orders
    .filter((o) => isWithinNextDays(o.scheduledDate, 7))
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Production Schedule (Next 7 Days)</p>
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders scheduled in the next 7 days.</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between border-t pt-2 text-sm first:border-t-0 first:pt-0"
            >
              <div>
                <p className="font-medium">{order.name}</p>
                <p className="text-xs text-muted-foreground">
                  {order.quantity.toLocaleString()} units · {order.scheduledDate}
                </p>
              </div>
              <span className={`h-2 w-2 rounded-full ${READY_DOT_CLASSES[order.status]}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/overview/mrp-run-panel.tsx components/dashboard/overview/stock-exhaustion-panel.tsx components/dashboard/overview/schedule-preview-panel.tsx
git commit -m "Add MRP run, stock exhaustion, and schedule preview panels"
```

---

### Task 5: Missing scan exceptions table

**Files:**
- Create: `components/dashboard/overview/missing-scan-table.tsx`

**Interfaces:**
- Consumes: `getMissingScanExceptions` from `@/lib/overview` (Task 2); `Button`, `Table`/`TableBody`/`TableCell`/`TableHead`/`TableHeader`/`TableRow` from `@/components/ui/*` (existing).
- Produces: `<MissingScanTable />`.

- [ ] **Step 1: Create `components/dashboard/overview/missing-scan-table.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMissingScanExceptions } from "@/lib/overview";

export function MissingScanTable() {
  const [exceptions, setExceptions] = useState(getMissingScanExceptions);

  function handleResolve(id: string) {
    setExceptions((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
  }

  const unresolvedCount = exceptions.filter((e) => !e.resolved).length;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Missing Scan Exceptions</p>
        <span className="text-xs text-muted-foreground">{unresolvedCount} unresolved</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Work Order</TableHead>
            <TableHead>Part</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Shift</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exceptions.map((exception) => (
            <TableRow key={exception.id}>
              <TableCell className="font-mono text-xs">{exception.workOrderCode}</TableCell>
              <TableCell>{exception.part}</TableCell>
              <TableCell>{exception.station}</TableCell>
              <TableCell>{exception.shift}</TableCell>
              <TableCell>{exception.date}</TableCell>
              <TableCell className="text-right">
                {exception.resolved ? (
                  <span className="text-xs text-muted-foreground">Resolved</span>
                ) : (
                  <Button size="sm" onClick={() => handleResolve(exception.id)}>
                    Resolve
                  </Button>
                )}
              </TableCell>
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
git add components/dashboard/overview/missing-scan-table.tsx
git commit -m "Add missing scan exceptions table"
```

---

### Task 6: Coverage trend and trace-by-line charts

**Files:**
- Create: `components/dashboard/overview/coverage-chart.tsx`
- Create: `components/dashboard/overview/trace-line-chart.tsx`

**Interfaces:**
- Consumes: `getMaterialCoverageTrend`, `getTraceCompletenessByLine` from `@/lib/overview` (Tasks 1/2).
- Produces: `<CoverageChart />`, `<TraceLineChart />`.

- [ ] **Step 1: Create `components/dashboard/overview/coverage-chart.tsx`**

```tsx
import { getMaterialCoverageTrend } from "@/lib/overview";

const SERIES_COLORS = ["#F0731A", "#16A34A", "#2563EB", "#9333EA"];
const WIDTH = 480;
const HEIGHT = 200;
const PADDING = 24;

export function CoverageChart() {
  const trend = getMaterialCoverageTrend();
  const materials = Object.keys(trend[0]?.series ?? {});
  const maxValue = Math.max(...trend.flatMap((point) => Object.values(point.series)), 1);

  function toXY(index: number, value: number): [number, number] {
    const x = PADDING + (index / (trend.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - (value / maxValue) * (HEIGHT - PADDING * 2);
    return [x, y];
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Material Coverage Trend (Weeks)</p>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Material coverage trend in weeks of stock"
      >
        {materials.map((material, mi) => {
          const points = trend
            .map((point, i) => toXY(i, point.series[material]))
            .map(([x, y]) => `${x},${y}`)
            .join(" ");
          return (
            <polyline
              key={material}
              points={points}
              fill="none"
              stroke={SERIES_COLORS[mi % SERIES_COLORS.length]}
              strokeWidth={2}
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {materials.map((material, mi) => (
          <span key={material} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: SERIES_COLORS[mi % SERIES_COLORS.length] }}
            />
            {material}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/dashboard/overview/trace-line-chart.tsx`**

```tsx
import { getTraceCompletenessByLine } from "@/lib/overview";

export function TraceLineChart() {
  const data = getTraceCompletenessByLine();

  if (data.length === 0) {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Trace Completeness by Assembly Line (7d)</p>
        <p className="text-sm text-muted-foreground">No build records yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Trace Completeness by Assembly Line (7d)</p>
      <div className="space-y-2">
        {data.map((entry) => (
          <div key={entry.line} className="grid grid-cols-[140px_1fr_40px] items-center gap-3 text-sm">
            <span className="text-muted-foreground">{entry.line}</span>
            <div className="h-3 rounded-full bg-muted">
              <div className="h-3 rounded-full bg-primary-500" style={{ width: `${entry.value}%` }} />
            </div>
            <span className="text-right font-medium">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/overview/coverage-chart.tsx components/dashboard/overview/trace-line-chart.tsx
git commit -m "Add coverage trend and trace-by-line charts"
```

---

### Task 7: Nav integration

**Files:**
- Modify: `components/dashboard/dashboard-nav.tsx`

- [ ] **Step 1: Add the Overview link as the first entry in `NAV_LINKS`**

In `components/dashboard/dashboard-nav.tsx`, find:

```ts
const NAV_LINKS = [
  { href: "/dashboard", label: "Orders" },
  { href: "/dashboard/production", label: "Production" },
  { href: "/dashboard/traceability", label: "Traceability" },
];
```

Replace with:

```ts
const NAV_LINKS = [
  { href: "/dashboard/overview", label: "Overview" },
  { href: "/dashboard", label: "Orders" },
  { href: "/dashboard/production", label: "Production" },
  { href: "/dashboard/traceability", label: "Traceability" },
];
```

No other change to this file.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/dashboard-nav.tsx
git commit -m "Add Overview link to dashboard nav"
```

---

### Task 8: Overview page — wire it all together, verify end-to-end, open PR

**Files:**
- Create: `app/dashboard/overview/page.tsx`

**Interfaces:**
- Consumes: `getOrders` from `@/lib/orders`; `ensureTraceabilitySeeded` from `@/lib/traceability`; `getLiveMetrics`, `getMockMetrics` from `@/lib/overview` (Task 1); `MetricCard` (Task 3), `MrpRunPanel`/`StockExhaustionPanel`/`SchedulePreviewPanel` (Task 4), `MissingScanTable` (Task 5), `CoverageChart`/`TraceLineChart` (Task 6); `Button` from `@/components/ui/button`; `useRouter` from `next/navigation`.

- [ ] **Step 1: Create `app/dashboard/overview/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrders } from "@/lib/orders";
import { ensureTraceabilitySeeded } from "@/lib/traceability";
import { getLiveMetrics, getMockMetrics } from "@/lib/overview";
import type { ProductionOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/overview/metric-card";
import { MrpRunPanel } from "@/components/dashboard/overview/mrp-run-panel";
import { StockExhaustionPanel } from "@/components/dashboard/overview/stock-exhaustion-panel";
import { SchedulePreviewPanel } from "@/components/dashboard/overview/schedule-preview-panel";
import { MissingScanTable } from "@/components/dashboard/overview/missing-scan-table";
import { CoverageChart } from "@/components/dashboard/overview/coverage-chart";
import { TraceLineChart } from "@/components/dashboard/overview/trace-line-chart";

// Same rationale as the other dashboard pages: this only ever renders on the
// client after DashboardLayout's auth-gated mount check, so seeding here is
// safe. ensureTraceabilitySeeded() also seeds orders, which every live metric
// on this page depends on existing.
function loadOrders(): ProductionOrder[] {
  ensureTraceabilitySeeded();
  return getOrders();
}

export default function OverviewPage() {
  const router = useRouter();
  const [orders] = useState<ProductionOrder[]>(loadOrders);
  const metrics = [...getLiveMetrics(), ...getMockMetrics()];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Planning Overview</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CoverageChart />
        <TraceLineChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MrpRunPanel />
        <StockExhaustionPanel />
        <SchedulePreviewPanel orders={orders} />
      </div>

      <MissingScanTable />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled>
          Run MRP
        </Button>
        <Button variant="outline" disabled>
          Review Purchase Plan
        </Button>
        <Button variant="outline" onClick={() => router.push("/dashboard/traceability")}>
          BOM Traceability
        </Button>
        <Button variant="outline" disabled>
          Check Slow-Moving Stock
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm run test`
Expected: all suites PASS (`auth`, `orders`, `traceability`, `traceability-export`, `production`, `overview`).

- [ ] **Step 3: Type-check and lint the whole project**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. If you see a `LayoutProps` error in `app/layout.tsx`, run `next build` once to regenerate `.next/types` (git-ignored build output not present in a fresh worktree) and confirm zero errors remain.

- [ ] **Step 4: Manual end-to-end verification in a browser**

Run `npm run dev` on a free port, then in a browser:
1. Log in with any `*@gmail.com` address and any password.
2. Confirm the top nav now shows **Overview** first, then Orders, Production, Traceability.
3. Click **Overview**. Confirm all 14 KPI cards render (5 live + 9 mock), each with a colored left border matching its tone.
4. Confirm both charts render (a multi-line SVG chart and a horizontal-bar chart).
5. Confirm the three panels render: MRP Run Status (click "Re-run MRP Now" — confirm a toast appears, nothing crashes), Stock Exhaustion Alerts, Production Schedule (Next 7 Days) — the last one should reflect your actual seeded/created orders, not static data.
6. Confirm the Missing Scan Exceptions table renders, and clicking "Resolve" on a row updates it to "Resolved" without a page reload.
7. Confirm "BOM Traceability" navigates to `/dashboard/traceability`; the other three quick-action buttons are visibly disabled (not clickable).
8. Confirm dark mode renders everything legibly, including both charts.

- [ ] **Step 5: Commit, push, and open a PR against `feature/production-module`**

```bash
git add app/dashboard/overview/page.tsx
git commit -m "Add Planning Overview page wiring metrics, charts, panels, and exceptions table"
git push -u origin feature/planning-overview
```

Open a PR with `gh pr create --base feature/production-module --head feature/planning-overview` (base is the Production branch, not `main`, since this branch depends on it and both #3 and #4 are still open) — include a summary of what was built, which cards are live vs. preview data, the design/plan doc paths, and the test/verification results from Steps 2-4.
