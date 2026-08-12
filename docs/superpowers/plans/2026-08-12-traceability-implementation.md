# BOM Traceability Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a BOM Traceability module (Trace Search + Population at Risk tabs, wired to real Production Order data) matching and lightly enhancing the reference feature set at `prodplanner.joulestowatts.online/traceability`.

**Architecture:** A new `lib/traceability.ts` data layer (same localStorage pattern as `lib/orders.ts`) deterministically generates build/lot/supplier/warranty-claim records from existing Production Orders. A new `lib/traceability-export.ts` builds downloadable CSV/text reports. New presentational components under `components/dashboard/traceability/` render two tabs on a new `/dashboard/traceability` page, reachable via a nav link added to `DashboardNav`.

**Tech Stack:** Next.js App Router, TypeScript, shadcn/ui (`Tabs`, `Select`, `Badge`, `Button`, `Input`), Tailwind CSS, Vitest.

## Global Constraints

- No backend, no new npm dependencies — everything persists in `localStorage`, matching the app's v1 demo architecture (see `docs/superpowers/specs/2026-08-11-production-planning-v1-design.md`).
- Follow existing conventions exactly: `lib/*.ts` data modules read via try/catch-returning-safe-default, writes propagate errors to the caller for toast surfacing; components are presentational and call `lib/` functions directly (no global state library).
- Data generation must be **deterministic per order id** — reloading the page must never reshuffle traceability data (mirrors the existing `seedOrdersIfEmpty` idempotency guarantee, tested in `lib/__tests__/orders.test.ts`).
- No automated tests for React components — this codebase only unit-tests `lib/`, per its existing convention (`lib/__tests__/auth.test.ts`, `lib/__tests__/orders.test.ts`). Component tasks are verified via `npx tsc --noEmit` + `npm run lint`; the final integration task is verified in a real browser.
- Orange brand palette only (`primary-*` Tailwind tokens already defined in `app/globals.css`) plus existing neutral/destructive tokens — no new colors except standard Tailwind `amber-*` for "conditional/warning" states (already available via Tailwind v4's default palette, no config change needed).
- Reference spec: `docs/superpowers/specs/2026-08-12-traceability-design.md`. Every task below implements a specific section of it.

---

### Task 1: Data model types + traceability core (pools, seeding, base accessors)

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/traceability.ts`
- Create: `lib/__tests__/traceability.test.ts`

**Interfaces:**
- Produces: `Supplier`, `MaterialLot`, `ProcessParam`, `QcResult`, `BuildRecord`, `WarrantyClaim`, `CriticalAlert`, `TraceResult`, `PopulationFilters`, `FunnelResult` (types); `getSuppliers(): Supplier[]`, `getLots(): MaterialLot[]`, `getBuildRecords(): BuildRecord[]`, `getWarrantyClaims(): WarrantyClaim[]`, `seedTraceabilityIfEmpty(orders: ProductionOrder[]): void`.

- [ ] **Step 1: Add the new types to `lib/types.ts`**

Append to the end of the existing file:

```ts
export interface Supplier {
  id: string;
  name: string;
  approved: boolean;
}

export interface MaterialLot {
  lotNumber: string;
  materialName: string;
  supplierId: string;
  supplierLotNumber: string;
  heatNumber: string;
  grDate: string; // ISO date
  coCRef: string;
  inspectionResult: "passed" | "failed";
  gradeNote?: string;
}

export interface ProcessParam {
  name: string;
  value: number;
  specMin: number;
  specMax: number;
  unit: string;
}

export type QcResult = "pass" | "conditional" | "fail";

export interface BuildRecord {
  serial: string;
  orderId: string;
  assemblyDate: string;
  workCentre: string;
  operator: string;
  lotsConsumed: string[];
  qcResult: QcResult;
  processParams: ProcessParam[];
  designCheckPass: boolean;
  supplierCheckPass: boolean;
  supplierCheckNote?: string;
  shipped: boolean;
  returned: boolean;
}

export interface WarrantyClaim {
  id: string;
  serial: string;
  customer: string;
  description: string;
  status: "open" | "investigating" | "resolved";
}

export interface CriticalAlert {
  label: string;
  query: string;
}

export interface TraceResult {
  builds: BuildRecord[];
  lot?: MaterialLot;
  supplier?: Supplier;
}

export interface PopulationFilters {
  lotNumber?: string;
  supplierId?: string;
  workCentre?: string;
}

export interface FunnelResult {
  totalProduced: number;
  lotUsedInBuild: number;
  assembledPassedQc: number;
  shippedToField: number;
  atRiskInField: number;
  returnedDefective: number;
  affectedSerials: BuildRecord[];
}
```

- [ ] **Step 2: Create `lib/traceability.ts` with the static pools, PRNG helpers, and seeding**

```ts
import type { BuildRecord, MaterialLot, ProcessParam, ProductionOrder, Supplier, WarrantyClaim } from "@/lib/types";

const BUILDS_KEY = "wayam.traceability.builds";
const CLAIMS_KEY = "wayam.traceability.claims";
const SEEDED_KEY = "wayam.traceability.seeded";

export const SUPPLIER_POOL: Supplier[] = [
  { id: "SUP-01", name: "Galaxy Surfactants", approved: true },
  { id: "SUP-02", name: "Jayant Agro", approved: true },
  { id: "SUP-03", name: "Vantage Specialty", approved: false },
];

export const LOT_POOL: MaterialLot[] = [
  { lotNumber: "LOT-2026-0178", materialName: "Surfactant SLES", supplierId: "SUP-01", supplierLotNumber: "GS-SLS-2026-021", heatNumber: "HN-88110", grDate: "2026-02-01", coCRef: "CoC-GS-2026-021", inspectionResult: "passed" },
  { lotNumber: "LOT-2026-0189", materialName: "Surfactant SLES", supplierId: "SUP-01", supplierLotNumber: "GS-SLS-2026-044", heatNumber: "HN-88421", grDate: "2026-02-18", coCRef: "CoC-GS-2026-044", inspectionResult: "failed", gradeNote: "Industrial (spec requires Cosmetic)" },
  { lotNumber: "LOT-2026-0195", materialName: "Fragrance Oil", supplierId: "SUP-02", supplierLotNumber: "JA-FRG-2026-009", heatNumber: "HN-77302", grDate: "2026-02-20", coCRef: "CoC-JA-2026-009", inspectionResult: "passed" },
  { lotNumber: "LOT-2026-0204", materialName: "Preservative Blend", supplierId: "SUP-02", supplierLotNumber: "JA-PRB-2026-014", heatNumber: "HN-77398", grDate: "2026-02-24", coCRef: "CoC-JA-2026-014", inspectionResult: "passed" },
  { lotNumber: "LOT-2026-0210", materialName: "Packaging Cap", supplierId: "SUP-03", supplierLotNumber: "VS-CAP-2026-031", heatNumber: "HN-90112", grDate: "2026-02-26", coCRef: "CoC-VS-2026-031", inspectionResult: "passed" },
  { lotNumber: "LOT-2026-0215", materialName: "Base Resin", supplierId: "SUP-03", supplierLotNumber: "VS-RES-2026-018", heatNumber: "HN-90177", grDate: "2026-02-28", coCRef: "CoC-VS-2026-018", inspectionResult: "passed" },
  { lotNumber: "LOT-2026-0230", materialName: "Colorant", supplierId: "SUP-01", supplierLotNumber: "GS-CLR-2026-007", heatNumber: "HN-88550", grDate: "2026-03-02", coCRef: "CoC-GS-2026-007", inspectionResult: "passed" },
  { lotNumber: "LOT-2026-0245", materialName: "Thickener", supplierId: "SUP-02", supplierLotNumber: "JA-THK-2026-011", heatNumber: "HN-77410", grDate: "2026-03-05", coCRef: "CoC-JA-2026-011", inspectionResult: "passed" },
];

const SUSPECT_LOT = LOT_POOL[1]; // LOT-2026-0189, failed inspection

const WORK_CENTRES = ["WC-01 Mixing", "WC-02 Filling", "WC-03 Packaging"];
const OPERATORS = ["OP-045 Suresh P.", "OP-023 Anita D.", "OP-067 Mohan K.", "OP-012 Priya S."];
const WARRANTY_CUSTOMERS = ["Reliance Retail", "BigBasket"];

function hashString(value: string): number {
  let h = 1779033703 ^ value.length;
  for (let i = 0; i < value.length; i++) {
    h = Math.imul(h ^ value.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

function readJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getSuppliers(): Supplier[] {
  return SUPPLIER_POOL;
}

export function getLots(): MaterialLot[] {
  return LOT_POOL;
}

export function getBuildRecords(): BuildRecord[] {
  return readJson<BuildRecord>(BUILDS_KEY);
}

export function getWarrantyClaims(): WarrantyClaim[] {
  return readJson<WarrantyClaim>(CLAIMS_KEY);
}

function generateBuildRecord(order: ProductionOrder, index: number, rand: () => number): BuildRecord {
  const lotIndices = new Set<number>();
  while (lotIndices.size < 3) {
    lotIndices.add(Math.floor(rand() * LOT_POOL.length));
  }
  const lotsConsumed = Array.from(lotIndices).map((i) => LOT_POOL[i].lotNumber);

  const processParams: ProcessParam[] = [
    { name: "Mix Temperature", specMin: 65, specMax: 80, unit: "°C", value: Math.round(65 + rand() * 15) },
    { name: "Mix Speed", specMin: 400, specMax: 500, unit: "RPM", value: Math.round(400 + rand() * 100) },
  ];

  return {
    serial: `SN-${order.id.replace(/-/g, "").slice(0, 4).toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
    orderId: order.id,
    assemblyDate: order.scheduledDate,
    workCentre: pick(WORK_CENTRES, rand),
    operator: pick(OPERATORS, rand),
    lotsConsumed,
    qcResult: "pass",
    processParams,
    designCheckPass: true,
    supplierCheckPass: true,
    shipped: order.status === "done",
    returned: false,
  };
}

function applyFailedLotThread(build: BuildRecord): void {
  build.lotsConsumed = [SUSPECT_LOT.lotNumber, ...build.lotsConsumed.filter((l) => l !== SUSPECT_LOT.lotNumber)];
  build.qcResult = "fail";
  build.supplierCheckPass = false;
  build.supplierCheckNote = `Inspection failed or material grade mismatch: ${SUSPECT_LOT.gradeNote}`;
  build.shipped = true;
  build.returned = true;
}

function applyProcessDeviationThread(build: BuildRecord): void {
  if (build.qcResult !== "fail") build.qcResult = "conditional";
  build.processParams = build.processParams.map((param, i) =>
    i === 0 ? { ...param, value: param.specMax + 3 } : param
  );
  build.shipped = true;
}

function buildWarrantyClaimsFor(build: BuildRecord): WarrantyClaim[] {
  return WARRANTY_CUSTOMERS.map((customer, i) => ({
    id: `WC-${build.serial}-${i + 1}`,
    serial: build.serial,
    customer,
    description:
      i === 0
        ? "Product discoloration and off-odour detected by end customer"
        : "Skin irritation complaint — possible surfactant contamination",
    status: "investigating" as const,
  }));
}

export function seedTraceabilityIfEmpty(orders: ProductionOrder[]): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEEDED_KEY)) return;
  if (orders.length === 0) return;

  window.localStorage.setItem(SEEDED_KEY, "true");

  const sortedOrders = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const builds: BuildRecord[] = [];

  for (const order of sortedOrders) {
    const rand = mulberry32(hashString(order.id));
    const serialCount = Math.min(5, Math.max(1, Math.round(order.quantity / 150)));
    for (let i = 0; i < serialCount; i++) {
      builds.push(generateBuildRecord(order, i, rand));
    }
  }

  applyFailedLotThread(builds[0]);
  applyProcessDeviationThread(builds[1] ?? builds[0]);

  writeJson(BUILDS_KEY, builds);
  writeJson(CLAIMS_KEY, buildWarrantyClaimsFor(builds[0]));
}
```

- [ ] **Step 3: Write `lib/__tests__/traceability.test.ts`**

```ts
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
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm run test -- run lib/__tests__/traceability.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/traceability.ts lib/__tests__/traceability.test.ts
git commit -m "Add traceability data model and deterministic seeding"
```

---

### Task 2: Trace search + critical alerts

**Files:**
- Modify: `lib/traceability.ts`
- Modify: `lib/__tests__/traceability.test.ts`

**Interfaces:**
- Consumes: `getBuildRecords()`, `LOT_POOL`, `SUPPLIER_POOL` from Task 1; `getOrders()` from `lib/orders.ts` (existing).
- Produces: `searchTrace(query: string): TraceResult`, `getCriticalAlerts(): CriticalAlert[]`.

- [ ] **Step 1: Add the import and both functions to `lib/traceability.ts`**

Add `getOrders` to the existing import block at the top (combine with the `lib/types` import already there):

```ts
import { getOrders } from "@/lib/orders";
```

Append to the end of the file:

```ts
export function searchTrace(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return { builds: [] as BuildRecord[] };

  const builds = getBuildRecords();

  const bySerial = builds.filter((b) => b.serial.toLowerCase() === q);
  if (bySerial.length > 0) return { builds: bySerial };

  const lot = LOT_POOL.find((l) => l.lotNumber.toLowerCase() === q);
  if (lot) {
    const supplier = SUPPLIER_POOL.find((s) => s.id === lot.supplierId);
    return {
      builds: builds.filter((b) => b.lotsConsumed.includes(lot.lotNumber)),
      lot,
      supplier,
    };
  }

  const matchedOrderIds = new Set(
    getOrders()
      .filter((order) => order.name.toLowerCase().includes(q))
      .map((order) => order.id)
  );
  if (matchedOrderIds.size > 0) {
    return { builds: builds.filter((b) => matchedOrderIds.has(b.orderId)) };
  }

  return {
    builds: builds.filter(
      (b) => b.serial.toLowerCase().includes(q) || b.lotsConsumed.some((l) => l.toLowerCase().includes(q))
    ),
  };
}

export function getCriticalAlerts() {
  return getBuildRecords()
    .filter((b) => b.qcResult !== "pass")
    .map((b) => ({
      label:
        b.qcResult === "fail"
          ? `Suspect lot ${b.lotsConsumed[0]} in active production — ${b.serial}`
          : `Process deviation at assembly — ${b.serial}`,
      query: b.serial,
    }));
}
```

Note: TypeScript will infer these return types structurally against `TraceResult`/`CriticalAlert[]` from `lib/types.ts` — no explicit annotation needed, but callers elsewhere in the plan type their own variables as `TraceResult` / `CriticalAlert[]`.

- [ ] **Step 2: Append tests to `lib/__tests__/traceability.test.ts`**

Add `createOrder` stays imported; add `getCriticalAlerts` and `searchTrace` to the existing import from `@/lib/traceability`. Append:

```ts
describe("searchTrace", () => {
  beforeEach(() => {
    createOrder({ name: "Widget batch A", quantity: 300, scheduledDate: "2026-09-01", status: "done" });
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
    createOrder({ name: "Widget batch B", quantity: 300, scheduledDate: "2026-09-02", status: "done" });
    seedTraceabilityIfEmpty(getOrders());
    expect(getCriticalAlerts().length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 3: Run the tests and confirm they pass**

Run: `npm run test -- run lib/__tests__/traceability.test.ts`
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/traceability.ts lib/__tests__/traceability.test.ts
git commit -m "Add trace search and critical alerts"
```

---

### Task 3: Population-at-risk funnel + containment priority

**Files:**
- Modify: `lib/traceability.ts`
- Modify: `lib/__tests__/traceability.test.ts`

**Interfaces:**
- Consumes: `getBuildRecords()`, `LOT_POOL` from Task 1.
- Produces: `getPopulationAtRisk(filters: PopulationFilters): FunnelResult`, `getContainmentPriority(funnel: FunnelResult): "Critical" | "Moderate" | "Low"`.

- [ ] **Step 1: Append to `lib/traceability.ts`**

```ts
export function getPopulationAtRisk(filters: { lotNumber?: string; supplierId?: string; workCentre?: string }) {
  const all = getBuildRecords();
  const totalProduced = all.length;

  const matchesFilters = (b: BuildRecord) => {
    if (filters.lotNumber && !b.lotsConsumed.includes(filters.lotNumber)) return false;
    if (filters.workCentre && b.workCentre !== filters.workCentre) return false;
    if (filters.supplierId) {
      const supplierLots = LOT_POOL.filter((l) => l.supplierId === filters.supplierId).map((l) => l.lotNumber);
      if (!b.lotsConsumed.some((l) => supplierLots.includes(l))) return false;
    }
    return true;
  };

  const lotUsedInBuild = all.filter(matchesFilters);
  const assembledPassedQc = lotUsedInBuild.filter((b) => b.qcResult !== "fail");
  const shippedToField = assembledPassedQc.filter((b) => b.shipped);
  const atRisk = shippedToField.filter((b) => b.qcResult !== "pass");
  const returnedDefective = shippedToField.filter((b) => b.returned);

  return {
    totalProduced,
    lotUsedInBuild: lotUsedInBuild.length,
    assembledPassedQc: assembledPassedQc.length,
    shippedToField: shippedToField.length,
    atRiskInField: atRisk.length,
    returnedDefective: returnedDefective.length,
    affectedSerials: atRisk,
  };
}

export function getContainmentPriority(funnel: { shippedToField: number; atRiskInField: number }) {
  if (funnel.shippedToField === 0) return "Low" as const;
  const ratio = funnel.atRiskInField / funnel.shippedToField;
  if (ratio >= 0.7) return "Critical" as const;
  if (ratio >= 0.4) return "Moderate" as const;
  return "Low" as const;
}
```

- [ ] **Step 2: Append tests to `lib/__tests__/traceability.test.ts`**

Add `getPopulationAtRisk` and `getContainmentPriority` to the existing import from `@/lib/traceability`. Append:

```ts
describe("getPopulationAtRisk", () => {
  beforeEach(() => {
    createOrder({ name: "Widget batch A", quantity: 300, scheduledDate: "2026-09-01", status: "done" });
    createOrder({ name: "Widget batch B", quantity: 300, scheduledDate: "2026-09-02", status: "done" });
    seedTraceabilityIfEmpty(getOrders());
  });

  it("keeps each funnel stage at or below the stage before it", () => {
    const funnel = getPopulationAtRisk({});
    expect(funnel.lotUsedInBuild).toBeLessThanOrEqual(funnel.totalProduced);
    expect(funnel.assembledPassedQc).toBeLessThanOrEqual(funnel.lotUsedInBuild);
    expect(funnel.shippedToField).toBeLessThanOrEqual(funnel.assembledPassedQc);
    expect(funnel.atRiskInField).toBeLessThanOrEqual(funnel.shippedToField);
    expect(funnel.returnedDefective).toBeLessThanOrEqual(funnel.shippedToField);
  });

  it("narrows the funnel when filtered to the suspect lot", () => {
    const filtered = getPopulationAtRisk({ lotNumber: "LOT-2026-0189" });
    expect(filtered.lotUsedInBuild).toBeGreaterThan(0);
    expect(filtered.affectedSerials.every((b) => b.lotsConsumed.includes("LOT-2026-0189"))).toBe(true);
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

- [ ] **Step 3: Run the tests and confirm they pass**

Run: `npm run test -- run lib/__tests__/traceability.test.ts`
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/traceability.ts lib/__tests__/traceability.test.ts
git commit -m "Add population-at-risk funnel and containment priority"
```

---

### Task 4: Export builders (8D report, affected-serials CSV, containment plan)

**Files:**
- Create: `lib/traceability-export.ts`
- Create: `lib/__tests__/traceability-export.test.ts`

**Interfaces:**
- Consumes: `FunnelResult`, `BuildRecord`, `WarrantyClaim` types from Task 1; `getContainmentPriority` from Task 3.
- Produces: `buildEightDReportText(build, claims): string`, `buildAffectedSerialsCsv(builds): string`, `buildContainmentPlanText(funnel): string`, `downloadTextFile(filename, content, mimeType): void`.

- [ ] **Step 1: Create `lib/traceability-export.ts`**

```ts
import type { BuildRecord, FunnelResult, WarrantyClaim } from "@/lib/types";
import { getContainmentPriority } from "@/lib/traceability";

export function buildEightDReportText(build: BuildRecord, claims: WarrantyClaim[]): string {
  const outOfSpec = build.processParams.filter((p) => p.value < p.specMin || p.value > p.specMax);

  const lines = [
    "8D REPORT — BOM TRACEABILITY",
    "=============================",
    `Serial: ${build.serial}`,
    `Assembly date: ${build.assemblyDate}`,
    `Work centre: ${build.workCentre}`,
    `Operator: ${build.operator}`,
    `Lots consumed: ${build.lotsConsumed.join(", ")}`,
    `QC result: ${build.qcResult.toUpperCase()}`,
    "",
    "D4 — Root Cause",
    ...(outOfSpec.length > 0
      ? outOfSpec.map((p) => `- ${p.name} = ${p.value}${p.unit} (spec: ${p.specMin}-${p.specMax}${p.unit})`)
      : ["- No process parameters out of spec"]),
    ...(build.supplierCheckNote ? [`- ${build.supplierCheckNote}`] : []),
    "",
    "D5 — Checks",
    `- Design check: ${build.designCheckPass ? "PASS" : "FAIL"}`,
    `- Supplier check: ${build.supplierCheckPass ? "PASS" : "FAIL"}`,
    "",
    `D8 — Linked warranty claims (${claims.length})`,
    ...(claims.length > 0
      ? claims.map((c) => `- ${c.id} · ${c.customer}: ${c.description} [${c.status.toUpperCase()}]`)
      : ["- None"]),
  ];

  return lines.join("\n");
}

export function buildAffectedSerialsCsv(builds: BuildRecord[]): string {
  const header = "serial,order_id,assembly_date,work_centre,qc_result,lots_consumed";
  const rows = builds.map((b) =>
    [b.serial, b.orderId, b.assemblyDate, b.workCentre, b.qcResult, b.lotsConsumed.join(" ")]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...rows].join("\n");
}

export function buildContainmentPlanText(funnel: FunnelResult): string {
  const priority = getContainmentPriority(funnel);

  const lines = [
    "CONTAINMENT ACTION PLAN",
    "========================",
    `Total produced: ${funnel.totalProduced}`,
    `Lot used in build: ${funnel.lotUsedInBuild}`,
    `Assembled & passed QC: ${funnel.assembledPassedQc}`,
    `Shipped to field: ${funnel.shippedToField}`,
    `At risk in field: ${funnel.atRiskInField}`,
    `Already returned/defective: ${funnel.returnedDefective}`,
    `Containment priority: ${priority}`,
    "",
    "Recommended steps:",
    "1. Quarantine remaining on-hand stock from the affected lot(s).",
    "2. Notify distribution partners holding the affected serial range.",
    "3. Issue a field containment notice for at-risk serials.",
    "4. Open a supplier corrective action request for the flagged lot.",
    "",
    `Affected serials (${funnel.affectedSerials.length}):`,
    ...(funnel.affectedSerials.length > 0 ? funnel.affectedSerials.map((b) => `- ${b.serial}`) : ["- None"]),
  ];

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Create `lib/__tests__/traceability-export.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { buildAffectedSerialsCsv, buildContainmentPlanText, buildEightDReportText } from "@/lib/traceability-export";
import type { BuildRecord, FunnelResult, WarrantyClaim } from "@/lib/types";

const sampleBuild: BuildRecord = {
  serial: "SN-TEST-001",
  orderId: "order-1",
  assemblyDate: "2026-03-18",
  workCentre: "WC-01 Mixing",
  operator: "OP-023 Anita D.",
  lotsConsumed: ["LOT-2026-0189"],
  qcResult: "fail",
  processParams: [{ name: "Mix Temperature", value: 83, specMin: 65, specMax: 80, unit: "°C" }],
  designCheckPass: true,
  supplierCheckPass: false,
  supplierCheckNote: "Inspection failed",
  shipped: true,
  returned: true,
};

const sampleClaims: WarrantyClaim[] = [
  { id: "WC-1", serial: "SN-TEST-001", customer: "Reliance Retail", description: "Discoloration", status: "investigating" },
];

describe("buildEightDReportText", () => {
  it("includes the out-of-spec parameter and linked claims", () => {
    const text = buildEightDReportText(sampleBuild, sampleClaims);
    expect(text).toContain("SN-TEST-001");
    expect(text).toContain("Mix Temperature = 83°C (spec: 65-80°C)");
    expect(text).toContain("Reliance Retail");
  });

  it("reports no out-of-spec parameters when everything is within spec", () => {
    const cleanBuild: BuildRecord = {
      ...sampleBuild,
      processParams: [{ name: "Mix Temperature", value: 72, specMin: 65, specMax: 80, unit: "°C" }],
    };
    expect(buildEightDReportText(cleanBuild, [])).toContain("No process parameters out of spec");
  });
});

describe("buildAffectedSerialsCsv", () => {
  it("produces a header row plus one quoted row per build", () => {
    const csv = buildAffectedSerialsCsv([sampleBuild]);
    const rows = csv.split("\n");
    expect(rows[0]).toBe("serial,order_id,assembly_date,work_centre,qc_result,lots_consumed");
    expect(rows[1]).toContain('"SN-TEST-001"');
    expect(rows[1]).toContain('"LOT-2026-0189"');
  });
});

describe("buildContainmentPlanText", () => {
  it("labels the plan Critical when the at-risk ratio is high", () => {
    const funnel: FunnelResult = {
      totalProduced: 10,
      lotUsedInBuild: 8,
      assembledPassedQc: 6,
      shippedToField: 5,
      atRiskInField: 4,
      returnedDefective: 1,
      affectedSerials: [sampleBuild],
    };
    const text = buildContainmentPlanText(funnel);
    expect(text).toContain("Containment priority: Critical");
    expect(text).toContain("SN-TEST-001");
  });
});
```

- [ ] **Step 3: Run the tests and confirm they pass**

Run: `npm run test -- run lib/__tests__/traceability-export.test.ts`
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/traceability-export.ts lib/__tests__/traceability-export.test.ts
git commit -m "Add traceability export builders (8D report, CSV, containment plan)"
```

---

### Task 5: QC result status styling + badge component

**Files:**
- Create: `lib/qc-status.ts`
- Create: `components/dashboard/qc-result-badge.tsx`

**Interfaces:**
- Consumes: `QcResult` type from Task 1; `Badge` from `@/components/ui/badge` (existing).
- Produces: `QC_RESULT_LABELS`, `QC_RESULT_CLASSES`, `<QcResultBadge result={QcResult} />`.

- [ ] **Step 1: Create `lib/qc-status.ts`**

```ts
import type { QcResult } from "@/lib/types";

export const QC_RESULT_LABELS: Record<QcResult, string> = {
  pass: "Pass",
  conditional: "Conditional",
  fail: "Fail",
};

export const QC_RESULT_CLASSES: Record<QcResult, string> = {
  pass: "bg-primary-100 text-primary-800 hover:bg-primary-100",
  conditional: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  fail: "bg-destructive/15 text-destructive hover:bg-destructive/15",
};
```

- [ ] **Step 2: Create `components/dashboard/qc-result-badge.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { QC_RESULT_CLASSES, QC_RESULT_LABELS } from "@/lib/qc-status";
import type { QcResult } from "@/lib/types";

export function QcResultBadge({ result }: { result: QcResult }) {
  return <Badge className={QC_RESULT_CLASSES[result]}>{QC_RESULT_LABELS[result]}</Badge>;
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/qc-status.ts components/dashboard/qc-result-badge.tsx
git commit -m "Add QC result badge component"
```

---

### Task 6: Nav links (Orders / Traceability) with live alert badge

**Files:**
- Modify: `components/dashboard/dashboard-nav.tsx`

**Interfaces:**
- Consumes: `getOrders`, `seedOrdersIfEmpty` from `lib/orders.ts` (existing); `getCriticalAlerts`, `seedTraceabilityIfEmpty` from Task 2/1; `cn` from `lib/utils.ts` (existing).

- [ ] **Step 1: Replace the contents of `components/dashboard/dashboard-nav.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { getOrders, seedOrdersIfEmpty } from "@/lib/orders";
import { getCriticalAlerts, seedTraceabilityIfEmpty } from "@/lib/traceability";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Orders" },
  { href: "/dashboard/traceability", label: "Traceability" },
];

function loadAlertCount(): number {
  seedOrdersIfEmpty();
  seedTraceabilityIfEmpty(getOrders());
  return getCriticalAlerts().length;
}

export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [alertCount] = useState(loadAlertCount);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div className="flex items-center gap-6">
        <Logo height={28} />
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary-100 text-primary-800"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {link.label}
              {link.label === "Traceability" && alertCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs text-white">
                  {alertCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/dashboard-nav.tsx
git commit -m "Add Orders/Traceability nav links with live alert badge"
```

---

### Task 7: Critical alert banner component

**Files:**
- Create: `components/dashboard/traceability/alert-banner.tsx`

**Interfaces:**
- Consumes: `CriticalAlert` type from Task 1.
- Produces: `<AlertBanner alerts={CriticalAlert[]} onSelect={(query: string) => void} />`.

- [ ] **Step 1: Create `components/dashboard/traceability/alert-banner.tsx`**

```tsx
"use client";

import type { CriticalAlert } from "@/lib/types";

interface AlertBannerProps {
  alerts: CriticalAlert[];
  onSelect: (query: string) => void;
}

export function AlertBanner({ alerts, onSelect }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
      <span className="font-medium text-destructive">
        ⚠ {alerts.length} critical traceability alert{alerts.length > 1 ? "s" : ""}
      </span>
      {" — "}
      {alerts.map((alert, i) => (
        <span key={alert.query}>
          <button
            type="button"
            className="underline underline-offset-2 hover:no-underline"
            onClick={() => onSelect(alert.query)}
          >
            {alert.label}
          </button>
          {i < alerts.length - 1 ? " · " : ""}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/traceability/alert-banner.tsx
git commit -m "Add traceability critical alert banner"
```

---

### Task 8: Genealogy tree component

**Files:**
- Create: `components/dashboard/traceability/genealogy-tree.tsx`

**Interfaces:**
- Consumes: `getLots`, `getSuppliers` from Task 1; `BuildRecord` type from Task 1.
- Produces: `<GenealogyTree builds={BuildRecord[]} />`.

- [ ] **Step 1: Create `components/dashboard/traceability/genealogy-tree.tsx`**

```tsx
import { getLots, getSuppliers } from "@/lib/traceability";
import type { BuildRecord } from "@/lib/types";

interface GenealogyTreeProps {
  builds: BuildRecord[];
}

export function GenealogyTree({ builds }: GenealogyTreeProps) {
  if (builds.length === 0) return null;

  const lots = getLots();
  const suppliers = getSuppliers();
  const lotNumbers = Array.from(new Set(builds.flatMap((b) => b.lotsConsumed)));

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Genealogy</p>
      <div className="flex flex-wrap items-start gap-4">
        {lotNumbers.map((lotNumber) => {
          const lot = lots.find((l) => l.lotNumber === lotNumber);
          const supplier = lot ? suppliers.find((s) => s.id === lot.supplierId) : undefined;
          const consumingBuilds = builds.filter((b) => b.lotsConsumed.includes(lotNumber));

          return (
            <div key={lotNumber} className="flex items-center gap-2">
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
                <p className="font-medium">{supplier?.name ?? "Unknown supplier"}</p>
                <p className="text-muted-foreground">supplier</p>
              </div>
              <span className="text-muted-foreground">&rarr;</span>
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
                <p className="font-medium">{lotNumber}</p>
                <p className="text-muted-foreground">lot</p>
              </div>
              <span className="text-muted-foreground">&rarr;</span>
              <div className="flex flex-col gap-1">
                {consumingBuilds.map((b) => (
                  <div key={b.serial} className="rounded-md border bg-primary-50 px-3 py-2 text-xs">
                    <p className="font-medium">{b.serial}</p>
                    <p className="text-muted-foreground">serial</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/traceability/genealogy-tree.tsx
git commit -m "Add traceability genealogy tree component"
```

---

### Task 9: MBOM build-record card + SBOM lot-record card

**Files:**
- Create: `components/dashboard/traceability/lot-record-card.tsx`
- Create: `components/dashboard/traceability/build-record-card.tsx`

**Interfaces:**
- Consumes: `getWarrantyClaims` from Task 2; `buildEightDReportText`, `downloadTextFile` from Task 4; `QcResultBadge` from Task 5; `MaterialLot`, `Supplier`, `BuildRecord` types from Task 1.
- Produces: `<LotRecordCard lot={MaterialLot} supplier={Supplier | undefined} />`, `<BuildRecordCard build={BuildRecord} onSelectLot?: (lotNumber: string) => void />`.

- [ ] **Step 1: Create `components/dashboard/traceability/lot-record-card.tsx`**

```tsx
import type { MaterialLot, Supplier } from "@/lib/types";

interface LotRecordCardProps {
  lot: MaterialLot;
  supplier?: Supplier;
}

export function LotRecordCard({ lot, supplier }: LotRecordCardProps) {
  return (
    <div className="space-y-2 rounded-lg border border-amber-300/60 bg-amber-50/50 p-4 dark:bg-amber-950/20">
      <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-400">
        SBOM — Supplier Bill of Materials
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Supplier</p>
          <p>{supplier?.name ?? "Unknown"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Supplier Lot</p>
          <p>{lot.supplierLotNumber}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Heat Number</p>
          <p>{lot.heatNumber}</p>
        </div>
        <div>
          <p className="text-muted-foreground">GR Date</p>
          <p>{lot.grDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">CoC Ref</p>
          <p>{lot.coCRef}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Inspection</p>
          <p className={lot.inspectionResult === "failed" ? "font-medium text-destructive" : ""}>
            {lot.inspectionResult.toUpperCase()}
          </p>
        </div>
      </div>
      {lot.gradeNote && lot.inspectionResult === "failed" && (
        <p className="text-sm text-destructive">
          ⚠ Inspection failed or material grade mismatch: {lot.gradeNote}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `components/dashboard/traceability/build-record-card.tsx`**

```tsx
"use client";

import { getWarrantyClaims } from "@/lib/traceability";
import { buildEightDReportText, downloadTextFile } from "@/lib/traceability-export";
import { QcResultBadge } from "@/components/dashboard/qc-result-badge";
import { Button } from "@/components/ui/button";
import type { BuildRecord } from "@/lib/types";

interface BuildRecordCardProps {
  build: BuildRecord;
  onSelectLot?: (lotNumber: string) => void;
}

export function BuildRecordCard({ build, onSelectLot }: BuildRecordCardProps) {
  const claims = getWarrantyClaims().filter((c) => c.serial === build.serial);
  const outOfSpec = build.processParams.filter((p) => p.value < p.specMin || p.value > p.specMax);

  function handleExport() {
    const text = buildEightDReportText(build, claims);
    downloadTextFile(`8D-report-${build.serial}.txt`, text, "text/plain");
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          MBOM — Manufacturing Build Record
        </p>
        <QcResultBadge result={build.qcResult} />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Serial</p>
          <p>{build.serial}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Assembly Date</p>
          <p>{build.assemblyDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Work Centre</p>
          <p>{build.workCentre}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Operator</p>
          <p>{build.operator}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Lots Consumed</p>
          <p className="flex flex-wrap gap-1">
            {build.lotsConsumed.map((lotNumber, i) => (
              <span key={lotNumber}>
                {onSelectLot ? (
                  <button
                    type="button"
                    className="underline underline-offset-2 hover:no-underline"
                    onClick={() => onSelectLot(lotNumber)}
                  >
                    {lotNumber}
                  </button>
                ) : (
                  lotNumber
                )}
                {i < build.lotsConsumed.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      </div>

      {outOfSpec.length > 0 && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          ⚠ Process parameter(s) out of spec:{" "}
          {outOfSpec
            .map((p) => `${p.name} = ${p.value}${p.unit} (spec: ${p.specMin}-${p.specMax}${p.unit})`)
            .join("; ")}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border px-3 py-2 text-sm">
          <span className={build.designCheckPass ? "text-primary-600" : "text-destructive"}>
            {build.designCheckPass ? "✓" : "✗"}
          </span>{" "}
          <span className="font-medium">Design Check</span>
          <p className="text-muted-foreground">
            {build.designCheckPass ? "Correct revision active on build date" : "Revision mismatch at assembly"}
          </p>
        </div>
        <div className="rounded-md border px-3 py-2 text-sm">
          <span className={outOfSpec.length === 0 ? "text-primary-600" : "text-destructive"}>
            {outOfSpec.length === 0 ? "✓" : "✗"}
          </span>{" "}
          <span className="font-medium">Process Check</span>
          <p className="text-muted-foreground">
            {outOfSpec.length === 0
              ? "All process parameters within spec"
              : `${outOfSpec.length} parameter(s) out of spec at assembly`}
          </p>
        </div>
        <div className="rounded-md border px-3 py-2 text-sm">
          <span className={build.supplierCheckPass ? "text-primary-600" : "text-destructive"}>
            {build.supplierCheckPass ? "✓" : "✗"}
          </span>{" "}
          <span className="font-medium">Supplier Check</span>
          <p className="text-muted-foreground">
            {build.supplierCheckPass ? "Approved supplier, passed inspection, correct material" : "Issues: failed inspection"}
          </p>
        </div>
      </div>

      {claims.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary-600">Linked Warranty Claims ({claims.length})</p>
          {claims.map((claim) => (
            <div key={claim.id} className="flex items-center justify-between border-t pt-2 text-sm">
              <span>
                <span className="font-mono text-xs text-muted-foreground">{claim.id}</span>{" "}
                <span className="font-medium">{claim.customer}</span> — {claim.description}
              </span>
              <span className="text-xs font-medium text-amber-700 uppercase dark:text-amber-400">
                {claim.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={handleExport}>
        Export 8D Report
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/traceability/lot-record-card.tsx components/dashboard/traceability/build-record-card.tsx
git commit -m "Add MBOM build-record and SBOM lot-record cards"
```

---

### Task 10: Trace Search tab component

**Files:**
- Create: `components/dashboard/traceability/trace-search.tsx`

**Interfaces:**
- Consumes: `searchTrace`, `getBuildRecords`, `getLots` from Task 1/2; `BuildRecordCard` from Task 9; `LotRecordCard` from Task 9; `GenealogyTree` from Task 8; `TraceResult` type from Task 1.
- Produces: `<TraceSearch initialQuery?: string />`.

- [ ] **Step 1: Create `components/dashboard/traceability/trace-search.tsx`**

```tsx
"use client";

import { useMemo, useState, type FormEvent } from "react";
import { getBuildRecords, getLots, searchTrace } from "@/lib/traceability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BuildRecordCard } from "@/components/dashboard/traceability/build-record-card";
import { LotRecordCard } from "@/components/dashboard/traceability/lot-record-card";
import { GenealogyTree } from "@/components/dashboard/traceability/genealogy-tree";

interface TraceSearchProps {
  initialQuery?: string;
}

function sampleHints(): string[] {
  const builds = getBuildRecords();
  const lots = getLots();
  const clean = builds.find((b) => b.qcResult === "pass");
  const conditional = builds.find((b) => b.qcResult === "conditional");
  const suspectLot = lots.find((l) => l.inspectionResult === "failed");
  return [
    clean ? `${clean.serial} (clean)` : "",
    conditional ? `${conditional.serial} (deviation)` : "",
    suspectLot ? `${suspectLot.lotNumber} (suspect lot)` : "",
  ].filter((hint) => hint !== "");
}

export function TraceSearch({ initialQuery = "" }: TraceSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [showGenealogy, setShowGenealogy] = useState(false);
  const hints = useMemo(sampleHints, []);

  const result = useMemo(
    () => (submittedQuery ? searchTrace(submittedQuery) : { builds: [] }),
    [submittedQuery]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
  }

  function handleSelectLot(lotNumber: string) {
    setQuery(lotNumber);
    setSubmittedQuery(lotNumber);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by serial number, lot number, or order name..."
        />
        <Button type="submit">Search</Button>
      </form>

      {hints.length > 0 && <p className="text-xs text-muted-foreground">Try: {hints.join(" · ")}</p>}

      {submittedQuery && result.builds.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No trace records found for &ldquo;{submittedQuery}&rdquo;.
        </p>
      )}

      {result.lot && <LotRecordCard lot={result.lot} supplier={result.supplier} />}

      {result.builds.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {result.builds.length} build{result.builds.length > 1 ? "s" : ""} found
          </p>
          <Button variant="ghost" size="sm" onClick={() => setShowGenealogy((v) => !v)}>
            {showGenealogy ? "Hide" : "Show"} genealogy
          </Button>
        </div>
      )}

      {showGenealogy && <GenealogyTree builds={result.builds} />}

      <div className="space-y-4">
        {result.builds.map((build) => (
          <BuildRecordCard key={build.serial} build={build} onSelectLot={handleSelectLot} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/traceability/trace-search.tsx
git commit -m "Add Trace Search tab component"
```

---

### Task 11: Population at Risk tab component

**Files:**
- Create: `components/dashboard/traceability/population-at-risk.tsx`

**Interfaces:**
- Consumes: `getPopulationAtRisk`, `getContainmentPriority`, `getLots`, `getSuppliers`, `getBuildRecords` from Task 1/3; `buildAffectedSerialsCsv`, `buildContainmentPlanText`, `downloadTextFile` from Task 4; `PopulationFilters` type from Task 1.
- Produces: `<PopulationAtRisk />`.

- [ ] **Step 1: Create `components/dashboard/traceability/population-at-risk.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  getBuildRecords,
  getContainmentPriority,
  getLots,
  getPopulationAtRisk,
  getSuppliers,
} from "@/lib/traceability";
import { buildAffectedSerialsCsv, buildContainmentPlanText, downloadTextFile } from "@/lib/traceability-export";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "all";

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[140px_1fr_60px] items-center gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="h-3 rounded-full bg-muted">
        <div className="h-3 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-right font-medium">{value.toLocaleString()}</span>
    </div>
  );
}

export function PopulationAtRisk() {
  const [lotNumber, setLotNumber] = useState(ALL);
  const [supplierId, setSupplierId] = useState(ALL);
  const [workCentre, setWorkCentre] = useState(ALL);

  const lots = useMemo(getLots, []);
  const suppliers = useMemo(getSuppliers, []);
  const workCentres = useMemo(() => Array.from(new Set(getBuildRecords().map((b) => b.workCentre))), []);

  const funnel = useMemo(
    () =>
      getPopulationAtRisk({
        lotNumber: lotNumber === ALL ? undefined : lotNumber,
        supplierId: supplierId === ALL ? undefined : supplierId,
        workCentre: workCentre === ALL ? undefined : workCentre,
      }),
    [lotNumber, supplierId, workCentre]
  );

  const priority = getContainmentPriority(funnel);
  const atRiskRatio =
    funnel.shippedToField > 0 ? Math.round((funnel.atRiskInField / funnel.shippedToField) * 100) : 0;

  function handleExportSerials() {
    downloadTextFile("affected-serials.csv", buildAffectedSerialsCsv(funnel.affectedSerials), "text/csv");
  }

  function handleGeneratePlan() {
    downloadTextFile("containment-action-plan.txt", buildContainmentPlanText(funnel), "text/plain");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Lot Number</p>
          <Select value={lotNumber} onValueChange={setLotNumber}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string | null) => (!v || v === ALL ? "All Lots" : v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Lots</SelectItem>
              {lots.map((lot) => (
                <SelectItem key={lot.lotNumber} value={lot.lotNumber}>
                  {lot.lotNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Supplier</p>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string | null) =>
                  !v || v === ALL ? "All Suppliers" : (suppliers.find((s) => s.id === v)?.name ?? v)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Suppliers</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Assembly Line</p>
          <Select value={workCentre} onValueChange={setWorkCentre}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string | null) => (!v || v === ALL ? "All Lines" : v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Lines</SelectItem>
              {workCentres.map((wc) => (
                <SelectItem key={wc} value={wc}>
                  {wc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Containment Funnel</p>
        <FunnelBar label="Total Produced" value={funnel.totalProduced} max={funnel.totalProduced} />
        <FunnelBar label="Lot Used in Build" value={funnel.lotUsedInBuild} max={funnel.totalProduced} />
        <FunnelBar label="Assembled & Passed QC" value={funnel.assembledPassedQc} max={funnel.totalProduced} />
        <FunnelBar label="Shipped to Field" value={funnel.shippedToField} max={funnel.totalProduced} />
        <FunnelBar label="At Risk in Field" value={funnel.atRiskInField} max={funnel.totalProduced} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase">Units at Risk in Field</p>
          <p className="text-2xl font-semibold">{funnel.atRiskInField}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase">Already Returned / Defective</p>
          <p className="text-2xl font-semibold">{funnel.returnedDefective}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase">Containment Priority</p>
          <p className="text-2xl font-semibold">{priority}</p>
          <p className="text-xs text-muted-foreground">{atRiskRatio}% at-risk ratio</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExportSerials} disabled={funnel.affectedSerials.length === 0}>
          Export Affected Serial List
        </Button>
        <Button onClick={handleGeneratePlan}>Generate Containment Action Plan</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/traceability/population-at-risk.tsx
git commit -m "Add Population at Risk tab component"
```

---

### Task 12: Traceability page — wire it all together, verify end-to-end, deploy

**Files:**
- Create: `app/dashboard/traceability/page.tsx`

**Interfaces:**
- Consumes: `seedOrdersIfEmpty`, `getOrders` from `lib/orders.ts` (existing); `seedTraceabilityIfEmpty`, `getCriticalAlerts` from Task 1/2; `AlertBanner` from Task 7; `TraceSearch` from Task 10; `PopulationAtRisk` from Task 11; `Tabs`/`TabsContent`/`TabsList`/`TabsTrigger` from `@/components/ui/tabs` (existing).

- [ ] **Step 1: Create `app/dashboard/traceability/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { getOrders, seedOrdersIfEmpty } from "@/lib/orders";
import { getCriticalAlerts, seedTraceabilityIfEmpty } from "@/lib/traceability";
import type { CriticalAlert } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertBanner } from "@/components/dashboard/traceability/alert-banner";
import { TraceSearch } from "@/components/dashboard/traceability/trace-search";
import { PopulationAtRisk } from "@/components/dashboard/traceability/population-at-risk";

// Same rationale as app/dashboard/page.tsx: this only ever renders on the
// client after DashboardLayout's auth-gated mount check, so seeding here is safe.
function loadAlerts(): CriticalAlert[] {
  seedOrdersIfEmpty();
  seedTraceabilityIfEmpty(getOrders());
  return getCriticalAlerts();
}

export default function TraceabilityPage() {
  const [alerts] = useState(loadAlerts);
  const [activeTab, setActiveTab] = useState("search");
  const [activeQuery, setActiveQuery] = useState("");

  function handleAlertSelect(query: string) {
    setActiveQuery(query);
    setActiveTab("search");
  }

  return (
    <div className="space-y-6">
      <AlertBanner alerts={alerts} onSelect={handleAlertSelect} />
      <h1 className="text-2xl font-semibold">BOM Traceability</h1>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as string)}>
        <TabsList>
          <TabsTrigger value="search">Trace Search</TabsTrigger>
          <TabsTrigger value="risk">Population at Risk</TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="mt-4">
          <TraceSearch key={activeQuery} initialQuery={activeQuery} />
        </TabsContent>
        <TabsContent value="risk" className="mt-4">
          <PopulationAtRisk />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm run test`
Expected: all suites PASS (existing `auth`/`orders` tests plus the new `traceability`/`traceability-export` tests).

- [ ] **Step 3: Type-check and lint the whole project**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Manual end-to-end verification in a browser**

Run: `npm run dev`, then in a browser:
1. Log in with any `*@gmail.com` address and any password.
2. Confirm the top nav shows **Orders** and **Traceability**, with a red badge on Traceability.
3. Click **Traceability**. Confirm the critical alert banner renders with clickable alert text.
4. In **Trace Search**, use one of the "Try: ..." hints — confirm a build-record card renders with MBOM fields, QC badge, check chips, and (for the suspect-lot hint) an SBOM card above it.
5. Click "Show genealogy" — confirm the supplier → lot → serial chain renders.
6. Click a lot number inside a build card's "Lots Consumed" field — confirm it re-runs the search on that lot and shows the SBOM card plus every build consuming it.
7. Click "Export 8D Report" — confirm a `.txt` file downloads.
8. Click an alert in the banner — confirm it jumps to Trace Search with that query pre-filled and results shown.
9. Switch to **Population at Risk** — confirm the funnel bars and summary cards render, filters narrow the funnel, and both export buttons download files.
10. Confirm dark mode (via the existing theme toggle) renders all new components legibly.

- [ ] **Step 5: Commit and push**

```bash
git add app/dashboard/traceability/page.tsx
git commit -m "Add BOM Traceability page wiring alert banner, search, and population-at-risk tabs"
git push
```

- [ ] **Step 6: Deploy and confirm on the live URL**

Run: `vercel --prod` (or confirm the connected Vercel project auto-deploys on push), then visit the deployed URL and repeat the key checks from Step 4 (nav badge, trace search, exports, Population at Risk) on production.
