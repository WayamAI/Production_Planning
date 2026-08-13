# Planning Overview Dashboard — Design

**Date:** 2026-08-13
**Status:** Approved
**Repo:** https://github.com/WayamAI/Production_Planning
**Branches from:** `feature/production-module` (PR #4, not yet merged)

## Summary

Add a Planning Overview dashboard — the reference product's home/landing page — as module 3
of the larger decomposition (after Traceability and Production). This is genuinely a much
larger undertaking overall: the reference product has ~9 more modules and ~38 more pages
beyond what's built so far (crawled and catalogued via 44 live screenshots covering every
sidebar section: Material Planning, Planner's Workbench, Stock Exhaustion Alerts, Planning
Scenarios, Inventory, Purchase, Demand & Forecasting, Analytics & Reports, Settings).
Planning Overview is built first because it's small, high-impact (it's the app's home page
in the reference), and stitches together data this app already has.

## Reference feature audit (captured live via screenshots)

The Planning Overview page (reference root `/`) has three stacked rows of KPI cards, two
trend charts, three side-by-side panels, an exceptions table, and quick-action buttons:

**Row 1 (5 cards):** Materials at Risk, Open Purchase Orders, Schedule Adherence, Inventory
Health, Pending Work Orders.
**Row 2 (4 cards):** Trace Completeness, Mean RCA Time, Active Suspect Lots, Recall Accuracy.
**Row 3 (6 cards):** Plan Attainment, Forecast Accuracy, Order Fill Rate, Inventory Turns,
Cash in Inventory, Active Scenarios.
**Charts:** Material Coverage Trend (weeks, line chart, multiple materials), Trace
Completeness by Assembly Line (7d, grouped bar chart).
**Panels:** MRP Run Status (last run stats + "Re-run MRP Now" button), Stock Exhaustion
Alerts (top materials by days-of-coverage, action links), Production Schedule (Next 7 Days)
(product/qty/date/ready-indicator list).
**Table:** Missing Scan Exceptions (work order/part/station/shift/date/resolve action).
**Quick actions:** Run MRP, Review Purchase Plan, BOM Traceability, Check Slow-Moving Stock.

## Goals

- Rebuild this page's layout and every card/panel/chart faithfully.
- Every card that *can* be computed from data this app already owns (orders, build records,
  production constraints/updates) is wired to real, live-computed numbers — not decoration.
  This currently means: Pending Work Orders, Trace Completeness, Active Suspect Lots, Recall
  Accuracy, Schedule Adherence, Production Schedule (Next 7 Days), and the Trace Completeness
  by Assembly Line chart.
- Cards whose source module doesn't exist yet (Materials at Risk/Inventory, Open Purchase
  Orders/Purchase, Inventory Health/Inventory, Plan Attainment & MRP Run Status/Material
  Planning, Forecast Accuracy & Order Fill Rate/Demand & Forecasting, Cash in Inventory/
  Inventory financials, Active Scenarios/Planning Scenarios, Stock Exhaustion Alerts/Stock
  Exhaustion Alerts module, Missing Scan Exceptions/Material Planning) get a small, clearly-
  isolated deterministic seed dataset for now, so the page is complete and usable today. Each
  is written so it's a one-function swap to wire to real data once its owning module is built
  later in this decomposition — never a placeholder string, always a real (if currently
  static) number/list with correct types.
- Add "Overview" as a new first nav item (before Orders), matching the reference's
  information architecture where the dashboard is the true home page — without relocating
  the existing Orders route, to avoid a disruptive URL migration this late in the build.

## Non-Goals

- Real MRP run execution, real purchase order data, real inventory valuation, real demand
  forecasting — those are the Material Planning, Purchase, Inventory, and Demand &
  Forecasting modules, future slices in this decomposition. This page previews them with
  clearly-scoped mock data.
- Interactive drill-down from cards into their owning module's page (most of those pages
  don't exist yet). Buttons/links that would navigate to an unbuilt page are omitted or
  point at a page that does exist (e.g. "BOM Traceability" quick action links to the real
  `/dashboard/traceability` page).
- Changing `/dashboard` to redirect to this page. Discoverable via nav only, at
  `/dashboard/overview`.

## Data Model

New types in `lib/types.ts`:

```ts
export interface StockExhaustionAlert {
  id: string;
  material: string;
  quantity: string; // pre-formatted, e.g. "180 kg"
  daysOfCoverage: number;
  action: "Raise PO" | "Review" | "Monitor";
}

export interface MissingScanException {
  id: string;
  workOrderCode: string; // e.g. "WO-2026-0862" — display-only, not a real ProductionOrder link
  part: string;
  station: string;
  shift: "Shift A" | "Shift B" | "Shift C";
  date: string; // ISO date
  resolved: boolean;
}

export interface MrpRunStatus {
  lastRun: string; // ISO datetime
  durationSeconds: number;
  plannedOrders: number;
  exceptions: number;
}

export interface OverviewMetric {
  label: string;
  value: string; // pre-formatted for display, e.g. "14 SKUs", "91.4%", "₹6.84 Cr"
  trend?: string; // e.g. "↑ from 9 last week", "+2.1%"
  trendDirection?: "up" | "down" | "flat";
  tone: "critical" | "warning" | "good";
}
```

## Data Layer

New file `lib/overview.ts`:

- `getLiveMetrics(): OverviewMetric[]` — computes the metrics this app can genuinely derive
  today:
  - **Pending Work Orders**: count of orders with `status !== "completed"`, tone `warning`
    if any are `on_hold`/overdue, else `good`.
  - **Trace Completeness**: average `getTraceScore(order).percent` across all orders that
    have one (reuses `lib/production.ts`'s `getTraceScore`), formatted as a percentage.
  - **Active Suspect Lots**: `getCriticalAlerts().length` from `lib/traceability.ts` (already
    built), tone `critical` if `> 0`.
  - **Recall Accuracy**: derived from `getPopulationAtRisk({})`'s containment ratio (already
    built in Traceability) — `100 - (atRiskInField / max(shippedToField, 1)) * 100`, clamped
    to `[0, 100]`, tone `good` if `>= 95`.
  - **Schedule Adherence**: percentage of orders with `status === "completed"` whose
    `scheduledDate <= dueDate` (a proxy for "finished on or before commitment"), tone
    `warning` if `< 90`.
- `getMockMetrics(): OverviewMetric[]` — the remaining cards (Materials at Risk, Open
  Purchase Orders, Inventory Health, Plan Attainment, Forecast Accuracy, Order Fill Rate,
  Inventory Turns, Cash in Inventory, Active Scenarios), each a fixed, realistic constant
  value with a code comment naming the future module that will replace it — no randomness,
  since there's no source data to derive it from yet.
- `getMrpRunStatus(): MrpRunStatus` — fixed constant for now (Material Planning module will
  replace this).
- `getStockExhaustionAlerts(): StockExhaustionAlert[]` — fixed small list (Stock Exhaustion
  Alerts module will replace this).
- `getMissingScanExceptions(): MissingScanException[]` — fixed small list (Material Planning
  module will replace this); `resolved` toggles are cosmetic/local-only for this preview (no
  persistence), matching this page's "preview" status for unbuilt modules.
- `getMaterialCoverageTrend(): { week: string; series: Record<string, number> }[]` and
  `getTraceCompletenessByLine(): { line: string; value: number }[]` — the two charts. The
  second one *is* derivable from real data (build records grouped by `workCentre`, reusing
  the same pass/fail logic as `getTraceScore`) — implement it for real. The first (material
  coverage in weeks-of-stock) depends on Inventory, so it's a fixed illustrative series for
  now.

## Page & Components

- `app/dashboard/overview/page.tsx` — assembles everything below in the reference's layout
  order (3 KPI rows → 2 charts side by side → 3 panels side by side → exceptions table →
  quick actions).
- `components/dashboard/overview/metric-card.tsx` — one presentational card (label, value,
  trend line, left-border tone color), reused for all 15 KPI cards across all three rows.
- `components/dashboard/overview/mrp-run-panel.tsx` — last-run stats + a "Re-run MRP Now"
  button that's a no-op with a toast ("MRP re-run isn't available in this preview yet — full
  MRP lands with the Material Planning module.") rather than silently doing nothing or
  faking a real run.
- `components/dashboard/overview/stock-exhaustion-panel.tsx` — the alert list with a "View
  all" link that's disabled/omitted (no Stock Exhaustion Alerts page exists yet).
- `components/dashboard/overview/schedule-preview-panel.tsx` — Production Schedule (Next 7
  Days), built from real `ProductionOrder`s within the next 7 days, with a colored
  ready-indicator dot derived from `status`.
- `components/dashboard/overview/missing-scan-table.tsx` — the exceptions table with local
  (non-persisted) resolve toggling.
- `components/dashboard/overview/coverage-chart.tsx` and
  `components/dashboard/overview/trace-line-chart.tsx` — two lightweight custom charts (SVG/
  CSS, no charting library — same precedent as every other chart-like element built so far
  in this app: the order timeline, the traceability funnel bars, the production Gantt).

## Navigation

- `components/dashboard/dashboard-nav.tsx`: `NAV_LINKS` gains `{ href: "/dashboard/overview",
  label: "Overview" }` as the **first** entry (before Orders).

## Error Handling

Same convention throughout: no persistence for this page's mock/preview data (nothing to
fail to save), real-data computations reuse already-hardened functions from `lib/orders.ts`/
`lib/traceability.ts`/`lib/production.ts` which already handle empty/missing data safely.

## Testing

`lib/__tests__/overview.test.ts`:
- `getLiveMetrics()`: correct values against seeded orders/builds for each of the 5 live
  metrics; correct tone assignment at each threshold boundary.
- `getTraceCompletenessByLine()`: correct grouping and percentage per work centre, matches
  what `getTraceScore` would compute per-order aggregated by line.
- Mock data getters: stable, correctly-typed output (not exhaustively tested since they're
  fixed constants — a smoke test per function is enough).

## Deployment & Git Workflow

New branch `feature/planning-overview`, forked from `feature/production-module` (not `main`)
since it depends on `lib/production.ts`'s `getTraceScore`. Same incremental-commit,
Subagent-Driven Development, task-reviewed, final-whole-branch-reviewed workflow as the prior
two modules.


## Implementation Notes (post-final-review)

Two deliberate deviations from this spec's literal card enumeration, recorded here so a
future fidelity audit of this page starts from an accurate baseline:

- **Card ordering is grouped by data provenance, not by the reference's semantic rows.** The
  page renders all 5 live-computed cards first, then the 10 mock-preview cards, rather than
  interleaving them into the reference's original 5/4/6 row grouping. This was judged better
  for a preview build: every genuinely real number is visually grouped together, making it
  easy to see at a glance what this page can actually back up today versus what's still
  waiting on a future module.
- **"Mean RCA Time" was initially omitted from the 15-card count** during implementation
  (shipped as 14 cards) and was added back as a 10th mock-preview entry in a post-final-review
  fix pass, once the final whole-branch review caught the gap against this spec's own
  reference audit.
