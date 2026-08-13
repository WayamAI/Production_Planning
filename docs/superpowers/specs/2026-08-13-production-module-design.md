# Production Module — Design

**Date:** 2026-08-13
**Status:** Approved
**Repo:** https://github.com/WayamAI/Production_Planning
**Branches from:** `feature/bom-traceability` (PR #3, not yet merged) — this module's Work Orders
tab depends on the Traceability data layer (`lib/traceability.ts`) built there.

## Summary

Add a Production module to the app, modeled on the `Production` section of the reference
manufacturing-ERP product at `prodplanner.joulestowatts.online` (crawled live: Production
Schedule, Work Orders, Constraints, Schedule Updates), matched closely and integrated with
this app's existing Production Orders and the Traceability module built previously — not
shipped as a disconnected demo dataset. This is module 2 of a larger decomposition; the
reference product has ~10 sidebar modules total (Material Planning, Planner's Workbench,
Stock Exhaustion Alerts, Planning Scenarios, Production, Inventory, Purchase, Demand &
Forecasting, Traceability, Analytics & Reports, Settings) — Production was chosen as the next
slice because it ties directly into Traceability (the reference's Work Orders table has a
live "Trace %" column).

## Reference feature audit (source of truth, captured live via browser)

**Production Schedule** (`/production-schedule`)
- Gantt / List toggle, "Last updated" timestamp, Refresh button.
- Gantt: rows = production lines (Line 1–4), a 7-day date header, colored bars per order
  spanning its scheduled window, labeled with product name.
- Sidebar: "Active Constraints" — top constraints with type, severity badge, one-line detail.

**Work Orders** (`/work-orders`)
- Status tabs with counts: All (234), Draft (18), Released (67), In Progress (41),
  Completed (90), On Hold (12), Overdue (6).
- Table columns: Work Order (WO-####), Product, Ordered, Produced, BOM (version), Scheduled,
  Due, Line, Trace % (colored progress bar — red/amber/green by value), Status (badge).
- Rows are not clickable (no drill-down/detail page confirmed by testing).

**Constraints** (`/production-constraints`)
- Summary counts: Open / Mitigated / Scheduled / Resolved.
- Table: ID (C-###), Type (Material Shortage, Machine Maintenance, Capacity Overload,
  Labour Shortage, Quality Hold, Utility Outage), Resource, Impact (linked work order(s) and
  what's affected), Severity (high/medium/low badge), Date, Resolution (free text), Status
  (Open/Mitigated/Scheduled/Resolved badge), Owner (person name).

**Schedule Updates** (`/schedule-updates`)
- "Live" indicator, Refresh button.
- Reverse-chronological activity feed. Each entry: type badge (Material Issue, Production
  Start, QC Passed, Quantity Update, Delay Alert, Schedule Change, Material Receipt,
  Completion, Shift Handover, Rework, Material Alert), one-line description, relative
  timestamp ("2 min ago"), actor ("by Suresh P." / "by System" / "by QC Lab"), linked work
  order badge where applicable.

## Goals

- Rebuild all four views above, fully functional against real app data, matching the
  reference's structure and information density.
- Extend the existing Production Orders data model rather than introducing a parallel
  "Work Order" entity — one source of truth, same integration philosophy used for
  Traceability.
- Make Work Orders' Trace % a genuine cross-module computation against the Traceability
  module's build records (not a random/cosmetic number) — this is the deliberate reason
  Production was picked as the next module.
- Keep scope tight: no work-order detail/drill-down page (the reference doesn't have one
  either, confirmed live), no real-time websocket for "Live" (static badge, consistent with
  this app's demo-data architecture).

## Non-Goals

- A separate Work Order CRUD entity/dialog — editing continues through the existing
  Orders tab's create/edit dialog, now covering the new fields.
- Real production-line capacity math, real MRP/scheduling algorithms — bars/constraints are
  seeded/derived data, same "convincing demo" philosophy as Traceability.
- The other ~8 reference modules (Inventory, Purchase, Material Planning, etc.) — future
  slices, each will get its own spec.

## Data Model

Extend `lib/types.ts`:

```ts
type OrderStatus =
  | "draft"
  | "released"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "overdue";
// Was: "pending" | "in_progress" | "done" — expanded to match the reference's 6 states
// exactly. This is a breaking rename of the existing 3-state enum; migration covers all
// existing call sites and tests (see Migration Notes below).

type ProductionLine = "Line 1" | "Line 2" | "Line 3" | "Line 4";

interface ProductionOrder {
  id: string;
  name: string;               // maps to "Product" in the Work Orders table
  quantity: number;           // "Ordered"
  producedQty: number;        // NEW — "Produced"
  scheduledDate: string;      // ISO date — "Scheduled"
  dueDate: string;            // NEW — ISO date, "Due"
  line: ProductionLine;       // NEW
  bomVersion: string;         // NEW — e.g. "v3.2"
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
```

`CreateOrderInput`/`UpdateOrderInput` extend accordingly (all new fields required on create,
`producedQty` defaulting to 0).

### Migration notes (existing Orders feature)

- `lib/order-status.ts`: `ORDER_STATUS_LABELS`/`ORDER_STATUS_CLASSES` expand to 6 entries.
  Color mapping: `draft` → neutral/muted, `released` → primary-100, `in_progress` →
  primary-300, `completed` → primary-600, `on_hold` → amber, `overdue` → destructive.
- `components/dashboard/order-form-dialog.tsx`: status `Select` gets 6 `SelectItem`s; form
  gains `Produced Qty`, `Due Date`, `Line` (select), `BOM Version` (text) fields, each with
  the same validation-on-submit pattern already used (required, sane bounds — e.g.
  `producedQty` between 0 and `quantity`).
- `lib/orders.ts` seed data (`seedOrdersIfEmpty`): update the 5 sample orders to use the new
  status values and populate the new fields with plausible values (mirrors the reference's
  flavor: a mix of draft/released/in_progress/completed/on_hold, spread across the 4 lines).
- `lib/__tests__/orders.test.ts`: update literal status strings and add coverage for the new
  fields exactly as it already does for existing ones.
- `components/dashboard/order-table.tsx` / `order-timeline.tsx`: no structural change needed
  — they already render whatever `OrderStatusBadge` produces; just verify layout still reads
  well with the two longer status labels ("In Progress", "On Hold").

## Navigation & Pages

- `components/dashboard/dashboard-nav.tsx` gains a third nav link — **Production**
  (`/dashboard/production`) — inserted between Orders and Traceability, following the exact
  same active-state `Link` pattern already used for the other two. No alert-count badge on
  this link (constraints/overdue counts are shown inside the module itself, not in the nav,
  to avoid three competing badges).
- New route: `app/dashboard/production/page.tsx`.
  - A shadcn `Tabs` with four tabs: **Schedule**, **Work Orders**, **Constraints**,
    **Updates** — same controlled/uncontrolled `Tabs` component already used for Orders and
    Traceability.

## Tab 1 — Production Schedule

- `components/dashboard/production/schedule-gantt.tsx`: custom lightweight Gantt (CSS
  grid/flex, no charting library — same precedent as the order timeline and the
  Traceability genealogy tree). Rows = the 4 fixed production lines; columns = a 7-day
  rolling window starting from the earliest visible order's scheduled date (or today,
  whichever is earlier); each order renders as a positioned, color-coded bar spanning
  `scheduledDate`→`dueDate`, labeled with its product name, colored by status (reusing
  `ORDER_STATUS_CLASSES`).
- Gantt/List toggle (local component state, not a route change). List mode reuses the same
  order-rendering logic as the Work Orders table (Tab 2) but without the status-tab filter —
  just sorted by scheduled date.
- Sidebar: `components/dashboard/production/active-constraints-panel.tsx` — top 3 open/
  highest-severity constraints (type, severity badge, one-line detail), sourced from Tab 3's
  data layer.

## Tab 2 — Work Orders

- `components/dashboard/production/work-order-table.tsx`: status-tab bar (All + the 6
  statuses, each with a live count from `getOrders()`), then a table: Work Order (`order.id`
  formatted as a short code, e.g. `WO-` + first 6 chars), Product, Ordered, Produced (with a
  slim inline progress indication consistent with the reference), BOM, Scheduled, Due, Line,
  Trace %, Status badge.
- **Trace % computation** (`lib/production.ts`, new file): for a given order, look up its
  `BuildRecord`s via `getBuildRecords().filter(b => b.orderId === order.id)` (from
  `lib/traceability.ts`, already built). If there are no build records yet (order not yet
  seeded into Traceability, or `producedQty === 0`), Trace % is blank/dash — matching the
  reference's Draft/Released rows showing no bar. Otherwise:
  `traceScore = round(100 * buildsPassingAllChecks / totalBuilds)`, where "passing all
  checks" means `designCheckPass && supplierCheckPass && qcResult !== "fail"`. Color
  thresholds mirror the observed reference pattern: `>= 95` primary/green, `70–94` amber,
  `< 70` destructive/red.

## Tab 3 — Constraints

- `lib/production.ts` exports `getConstraints(): Constraint[]`, seeded deterministically
  (same `mulberry32`/`hashString`-per-order-id pattern as Traceability) alongside order
  seeding: any order with `status === "on_hold"` or a due date in the past while not
  `completed` (i.e. logically overdue) gets a real constraint entry linking to it (Material
  Shortage / Capacity Overload / Quality Hold, picked deterministically); a small additional
  set of flavor constraints (Machine Maintenance, Labour Shortage, Utility Outage) round out
  the list from a fixed pool, mirroring the reference's mix of order-linked and general
  operational events.
- `components/dashboard/production/constraints-table.tsx`: summary counts row (Open/
  Mitigated/Scheduled/Resolved, computed live from the data) + table matching the reference's
  columns, with a `WorkOrderBadge`-style link back to the affected order where applicable.

## Tab 4 — Schedule Updates

- `lib/production.ts` exports `getScheduleUpdates(): ScheduleUpdate[]` — a reverse-
  chronological feed synthesized from existing data rather than a separate fake dataset:
  order status transitions produce "Production Start"/"Completion" entries, `BuildRecord`
  QC results produce "QC Passed"/"Delay Alert" entries, `Constraint`s produce "Material
  Issue"/"Schedule Change" entries, and `MaterialLot` goods-receipt dates (from
  `lib/traceability.ts`'s `LOT_POOL`) produce "Material Receipt" entries. Timestamps are
  synthetic-but-deterministic relative offsets (e.g. derived from a per-item hash), rendered
  as relative time ("2 min ago") the same way the existing timeline formats dates.
- `components/dashboard/production/schedule-updates-feed.tsx`: static "Live" badge (no
  websocket — matches the app's localStorage-only demo architecture), Refresh button
  (re-reads and re-sorts from source data, since nothing is truly streaming), feed list with
  type badge, description, relative time, actor, and linked work-order badge.

## Error Handling

- Same convention as `lib/orders.ts`/`lib/traceability.ts`: reads wrapped in try/catch
  returning safe empty defaults; writes (order edits with the new fields) propagate errors to
  the caller for toast surfacing, unchanged from the existing `OrderFormDialog` pattern.
- Empty states: no orders yet → existing "No production orders yet" continues to apply
  everywhere Work Orders/Schedule/Constraints/Updates would otherwise render; each new
  component gets its own explicit empty-state message rather than rendering blank.

## Testing

`lib/__tests__/production.test.ts` (Vitest, matching existing convention):
- Trace % computation: no build records → blank/undefined; all-passing builds → high score
  green-banded; mixed → correct percentage and correct color band at each threshold boundary.
- `getConstraints()`: deterministic and idempotent given the same orders (same idempotency
  pattern already tested for `seedOrdersIfEmpty`/`seedTraceabilityIfEmpty`); on_hold/overdue
  orders reliably produce a linked constraint; summary counts match the generated data.
- `getScheduleUpdates()`: produces a reverse-chronological feed; entries reference real
  order/build/lot data (no dangling references); idempotent across repeated calls with
  unchanged source data.

`lib/__tests__/orders.test.ts` updates: migrate literal status strings to the new 6-value
enum; add coverage for the 4 new fields on create/update.

## Deployment & Git Workflow

- New branch `feature/production-module`, forked from `feature/bom-traceability` (not
  `main`) because Trace % depends on `lib/traceability.ts`. Once `feature/bom-traceability`
  merges to `main`, this branch rebases onto `main` before its own PR.
- Same incremental-commit, Subagent-Driven Development, task-reviewed, final-whole-branch-
  reviewed workflow used for Traceability.
