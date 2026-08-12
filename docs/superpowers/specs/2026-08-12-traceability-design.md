# BOM Traceability Module — Design

**Date:** 2026-08-12
**Status:** Approved
**Repo:** https://github.com/WayamAI/Production_Planning

## Summary

Add a BOM Traceability module to the Production Planning app, modeled on the traceability
feature set at `https://prodplanner.joulestowatts.online/traceability` (a reference
manufacturing-ERP product), matched and lightly enhanced, and integrated with this app's
existing Production Orders rather than shipped as a disconnected demo dataset. Purpose: make
the app materially more comprehensive and demo-ready for a client/investor audience.

## Reference feature audit (source of truth, captured live via browser)

**Trace Search tab**
- Search by serial / lot / part number.
- Returns one or more MBOM build records: serial, assembly date, work centre, operator,
  lots consumed, QC result (PASS / CONDITIONAL / FAIL), inline out-of-spec parameter
  callouts (e.g. "Mix Temperature = 83, spec 65–80°C"). Multiple records surface when a
  lot was consumed across several builds (true multi-hop trace).
- Upstream SBOM (supplier) record: supplier, supplier lot, heat number, GR date, CoC ref,
  inspection result, grade-mismatch callout.
- Design / Process / Supplier check pass-fail indicators.
- Linked warranty claims (claim #, customer, description, status).
- "Export 8D Report" action.
- Page-level critical alert banner summarizing open issues.

**Population at Risk tab**
- Filters: lot number, supplier, assembly line.
- Containment funnel: Total Produced → Lot Used in Build → Assembled & Passed QC →
  Shipped to Field → At Risk in Field (counts per stage).
- Summary cards: Units at Risk in Field, Already Returned/Defective, Containment Priority
  (e.g. "Critical", with at-risk %).
- "Export Affected Serial List" and "Generate Containment Action Plan" actions.

## Goals

- Rebuild both tabs above, fully functional (not static mockups), wired to this app's real
  order data so the module feels native rather than bolted on.
- Two light enhancements beyond the reference: a genealogy/lineage tree view for a given
  lot/serial, and working file exports (CSV / txt) rather than inert buttons.
- Keep scope tight: no new persisted workflow module (e.g. no full CAPA tracker) — exports
  cover the "containment action plan" and "affected serial list" asks without adding new
  standing state beyond what's specified below.

## Non-Goals

- Real backend, real file storage, or real PDF generation — exports are client-generated
  `.txt`/`.csv` blobs via `Blob` + object URL, consistent with this app's localStorage-only
  architecture.
- A persisted CAPA/action-item tracker with its own status workflow.
- Multi-user / permissions / audit trail.

## Data Model

Additions to `lib/types.ts`:

```ts
interface Supplier {
  id: string;
  name: string;
  approved: boolean;
}

interface MaterialLot {
  lotNumber: string;
  materialName: string;
  supplierId: string;
  supplierLotNumber: string;
  heatNumber: string;
  grDate: string;              // ISO date, goods-receipt
  coCRef: string;               // certificate of conformance ref
  inspectionResult: "passed" | "failed";
  gradeNote?: string;           // e.g. "Industrial (spec requires Cosmetic)"
}

interface ProcessParam {
  name: string;
  value: number;
  specMin: number;
  specMax: number;
  unit: string;
}

type QcResult = "pass" | "conditional" | "fail";

interface BuildRecord {         // one manufactured serial (MBOM)
  serial: string;
  orderId: string;              // FK -> ProductionOrder.id
  assemblyDate: string;
  workCentre: string;
  operator: string;
  lotsConsumed: string[];       // MaterialLot["lotNumber"][]
  qcResult: QcResult;
  processParams: ProcessParam[];
  designCheckPass: boolean;
  supplierCheckPass: boolean;
  supplierCheckNote?: string;
  shipped: boolean;
  returned: boolean;
}

interface WarrantyClaim {
  id: string;
  serial: string;
  customer: string;
  description: string;
  status: "open" | "investigating" | "resolved";
}
```

## Seeding & Persistence

`lib/traceability.ts` follows the exact pattern of `lib/orders.ts`:

- A small fixed pool of suppliers (2–3) and shared material lots is seeded once, keyed by a
  `wayam.traceability.seeded` localStorage flag, mirroring `SEEDED_KEY` in `lib/orders.ts`.
- `seedTraceabilityIfEmpty(orders: ProductionOrder[])` is called from the traceability page
  the same way `seedOrdersIfEmpty()` is called from the dashboard page today: it generates
  1–5 `BuildRecord`s per existing order (count scaled from `quantity`, capped), drawing lots
  from the shared pool so lots are legitimately reused across multiple builds/orders — this
  reuse is what makes multi-hop search meaningful.
- Exactly two problem threads are injected deterministically so the module always has
  something to demo: one suspect/failed-inspection lot feeding into a CONDITIONAL/FAIL
  build with linked warranty claims, and one design/process out-of-spec build. This mirrors
  the reference site's "2 critical traceability alerts."
- Generation is deterministic per order id (no `Math.random()` without a seed derived from
  the order id) so re-renders and reloads don't reshuffle data, matching the idempotency
  expectation already tested for `seedOrdersIfEmpty`.
- All reads wrapped in try/catch returning `[]` on failure; writes propagate to the caller
  for toast surfacing — same convention as `lib/orders.ts`.

Accessor functions exposed from `lib/traceability.ts`:
- `getSuppliers()`, `getLots()`, `getBuildRecords()`, `getWarrantyClaims()`
- `searchTrace(query: string): { builds: BuildRecord[]; lot?: MaterialLot; supplier?: Supplier }`
- `getCriticalAlerts(): Array<{ label: string; query: string }>` — drives the banner and its
  click-to-search behavior.
- `getPopulationAtRisk(filters): FunnelResult` — pure function over generated data, filtered
  by lot/supplier/work centre.

## Navigation & Pages

- `components/dashboard/dashboard-nav.tsx` gains two active-state links — **Orders**
  (`/dashboard`) and **Traceability** (`/dashboard/traceability`) — plus a small badge on
  "Traceability" showing the live critical-alert count from `getCriticalAlerts()`.
- New route: `app/dashboard/traceability/page.tsx`.
  - Renders the critical alert banner (only when `getCriticalAlerts()` is non-empty).
  - Below it, a shadcn `Tabs` with **Trace Search** and **Population at Risk**, reusing the
    existing `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` primitives already used on the
    orders page.

## Trace Search Tab

- `components/dashboard/traceability/trace-search.tsx`: search `Input` + hint text ("Try: ...")
  populated from real seeded serials/lots (not hardcoded fake IDs), "No trace records found
  for '<query>'" empty state.
- `components/dashboard/traceability/build-record-card.tsx`: renders one `BuildRecord` —
  MBOM fields, QC result badge (new `qc-result-badge.tsx`, same pattern as
  `order-status-badge.tsx`), inline out-of-spec param callouts, Design/Process/Supplier
  check chips, linked warranty claims, "Export 8D Report" button (generates a `.txt` blob
  client-side and triggers download).
- Searching a lot number returns every `BuildRecord` whose `lotsConsumed` includes it, plus
  the upstream `MaterialLot`/`Supplier` record rendered as an SBOM card above the builds.
- Lot chips inside a build card are clickable and re-run the search on that lot number.
- `components/dashboard/traceability/genealogy-tree.tsx` (enhancement): a toggle that
  renders Supplier → Lot → Serial(s) → Order as nested/connected boxes using plain
  Tailwind flex/border layout — no charting/graph library, consistent with the existing
  "lightweight custom component, not a heavy library" precedent set by the order timeline.

## Population at Risk Tab

- `components/dashboard/traceability/population-at-risk.tsx`: three filter `Select`s (lot,
  supplier, work centre), all client-side over `getBuildRecords()`/`getLots()`.
- Funnel bars computed live from the filtered set: Total Produced, Lot Used in Build,
  Assembled & Passed QC, Shipped to Field, At Risk in Field.
- Summary cards: Units at Risk, Already Returned/Defective, Containment Priority — priority
  level derived from at-risk ratio (e.g. ≥70% Critical, ≥40% Moderate, else Low), not
  hardcoded.
- "Export Affected Serial List" downloads a `.csv` of the filtered at-risk serials.
- "Generate Containment Action Plan" downloads a `.txt` summary (root-cause thread,
  affected population, recommended steps) built from the filtered data.

## Error Handling

- Same convention as `lib/orders.ts`: reads wrapped in try/catch returning safe empty
  defaults; writes (seeding) propagate write errors to the caller, surfaced via the
  existing `sonner` toast setup.
- Search and filter empty states are explicit, never a blank page.

## Testing

`lib/__tests__/traceability.test.ts` (Vitest, matching existing convention):
- Seeding is deterministic and idempotent given the same orders (parallels the existing
  `seedOrdersIfEmpty` test).
- Funnel stage counts are internally consistent (each stage ≤ the one before it).
- Out-of-spec parameter detection flags correctly against `specMin`/`specMax`.
- `searchTrace` returns expected builds/lot/supplier for serial, lot, and no-match queries.
- CSV and 8D-report string builders produce expected, correctly-escaped content.

## Deployment & Git Workflow

- Same as existing convention: feature branch, small incremental commits (data layer →
  nav/page scaffold → trace search → population at risk → exports → tests), pushed and
  deployed to Vercel, verified end-to-end on the live URL before calling it done.
