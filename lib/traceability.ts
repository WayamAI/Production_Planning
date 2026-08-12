import type { BuildRecord, CriticalAlert, FunnelResult, MaterialLot, PopulationFilters, ProcessParam, ProductionOrder, Supplier, TraceResult, WarrantyClaim } from "@/lib/types";
import { getOrders, seedOrdersIfEmpty } from "@/lib/orders";

const BUILDS_KEY = "wayam.traceability.builds";
const CLAIMS_KEY = "wayam.traceability.claims";

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
  return items[Math.floor(rand() * items.length)];
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
  while (lotIndices.size < Math.min(3, LOT_POOL.length)) {
    lotIndices.add(Math.floor(rand() * LOT_POOL.length));
  }
  const lotsConsumed = Array.from(lotIndices).map((i) => LOT_POOL[i].lotNumber);

  const processParams: ProcessParam[] = [
    { name: "Mix Temperature", specMin: 65, specMax: 80, unit: "°C", value: Math.round(65 + rand() * 15) },
    { name: "Mix Speed", specMin: 400, specMax: 500, unit: "RPM", value: Math.round(400 + rand() * 100) },
  ];

  return {
    serial: `SN-${order.id.replace(/-/g, "").slice(0, 8).toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
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
  if (orders.length === 0) return;

  const existingBuilds = getBuildRecords();
  const isFirstSeed = existingBuilds.length === 0;

  const orderIds = new Set(orders.map((o) => o.id));
  const prunedBuilds = existingBuilds.filter((b) => orderIds.has(b.orderId));

  const orderIdsWithBuilds = new Set(prunedBuilds.map((b) => b.orderId));
  const newOrders = orders.filter((o) => !orderIdsWithBuilds.has(o.id));

  if (newOrders.length === 0) {
    if (prunedBuilds.length !== existingBuilds.length) {
      writeJson(BUILDS_KEY, prunedBuilds);
      const remainingSerials = new Set(prunedBuilds.map((b) => b.serial));
      writeJson(CLAIMS_KEY, getWarrantyClaims().filter((c) => remainingSerials.has(c.serial)));
    }
    return;
  }

  const sortedNewOrders = [...newOrders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const newBuilds: BuildRecord[] = [];
  for (const order of sortedNewOrders) {
    const rand = mulberry32(hashString(order.id));
    const serialCount = Math.min(5, Math.max(1, Math.round(order.quantity / 150)));
    for (let i = 0; i < serialCount; i++) {
      newBuilds.push(generateBuildRecord(order, i, rand));
    }
  }

  let claims = getWarrantyClaims();
  if (isFirstSeed) {
    applyFailedLotThread(newBuilds[0]);
    applyProcessDeviationThread(newBuilds[1] ?? newBuilds[0]);
    claims = buildWarrantyClaimsFor(newBuilds[0]);
  }

  writeJson(BUILDS_KEY, [...prunedBuilds, ...newBuilds]);
  writeJson(CLAIMS_KEY, claims);
}

export function searchTrace(query: string): TraceResult {
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

export function getCriticalAlerts(): CriticalAlert[] {
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

export function getPopulationAtRisk(filters: PopulationFilters): FunnelResult {
  const all = getBuildRecords();
  const totalProduced = all.length;

  const supplierLots = filters.supplierId
    ? LOT_POOL.filter((l) => l.supplierId === filters.supplierId).map((l) => l.lotNumber)
    : [];

  const matchesFilters = (b: BuildRecord) => {
    if (filters.lotNumber && !b.lotsConsumed.includes(filters.lotNumber)) return false;
    if (filters.workCentre && b.workCentre !== filters.workCentre) return false;
    if (filters.supplierId) {
      if (!b.lotsConsumed.some((l) => supplierLots.includes(l))) return false;
    }
    return true;
  };

  const lotUsedInBuild = all.filter(matchesFilters);
  const assembledPassedQc = lotUsedInBuild.filter((b) => b.qcResult !== "fail");
  const shippedToField = lotUsedInBuild.filter((b) => b.shipped);
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

export function getContainmentPriority(funnel: Pick<FunnelResult, "shippedToField" | "atRiskInField">): "Critical" | "Moderate" | "Low" {
  if (funnel.shippedToField === 0) return "Low" as const;
  const ratio = funnel.atRiskInField / funnel.shippedToField;
  if (ratio >= 0.7) return "Critical" as const;
  if (ratio >= 0.4) return "Moderate" as const;
  return "Low" as const;
}

export function ensureTraceabilitySeeded(): CriticalAlert[] {
  seedOrdersIfEmpty();
  seedTraceabilityIfEmpty(getOrders());
  return getCriticalAlerts();
}
