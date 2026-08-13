// ============================================================
// Traceability Data — Single source of truth across all pages
// All lot numbers, serial numbers, part numbers, and supplier
// names are internally consistent and cross-referenced.
// ============================================================

// --- Suppliers (reuse names from VendorManagement) ---
export const suppliers = [
  { id: "SUP-001", name: "Galaxy Surfactants", asl: true },
  { id: "SUP-002", name: "Aarti Industries", asl: true },
  { id: "SUP-003", name: "Rashtriya Chemicals", asl: true },
  { id: "SUP-004", name: "Mold-Tek Containers", asl: true },
  { id: "SUP-005", name: "Tronox India", asl: true },
  { id: "SUP-006", name: "Uflex Packaging", asl: true },
  { id: "SUP-007", name: "Deepak Nitrite", asl: true },
  { id: "SUP-008", name: "Givaudan India", asl: true },
  { id: "SUP-009", name: "Reliance Polymers", asl: true },
  { id: "SUP-010", name: "Gujarat Alkalies", asl: true },
  { id: "SUP-011", name: "Jayant Agro", asl: false }, // non-ASL for test scenario
] as const;

// --- Parts / EBOM ---
export interface EBOMPart {
  partNumber: string;
  partName: string;
  currentRevision: string;
  revisionHistory: { rev: string; date: string; eco: string; summary: string }[];
  effectivityStart: string;
  effectivityEnd: string;
  ecoNumber: string;
  ctq: boolean;
  traceabilityLevel: "serial" | "lot" | "batch" | "none";
  fieldFailureRate: number[]; // 12 months
}

export const ebomParts: EBOMPart[] = [
  {
    partNumber: "RM-4023",
    partName: "Sodium Lauryl Sulphate",
    currentRevision: "C",
    revisionHistory: [
      { rev: "A", date: "2024-06-01", eco: "ECO-2024-011", summary: "Initial release" },
      { rev: "B", date: "2025-02-15", eco: "ECO-2025-003", summary: "Updated purity spec from 92% to 95%" },
      { rev: "C", date: "2025-11-10", eco: "ECO-2025-018", summary: "Added heavy metals limit" },
    ],
    effectivityStart: "2025-11-10",
    effectivityEnd: "2027-11-10",
    ecoNumber: "ECO-2025-018",
    ctq: true,
    traceabilityLevel: "lot",
    fieldFailureRate: [0.2, 0.1, 0.3, 0.2, 0.4, 0.8, 1.2, 0.9, 0.5, 0.3, 0.2, 0.1],
  },
  {
    partNumber: "RM-2087",
    partName: "Stearic Acid",
    currentRevision: "B",
    revisionHistory: [
      { rev: "A", date: "2024-04-01", eco: "ECO-2024-005", summary: "Initial release" },
      { rev: "B", date: "2025-09-20", eco: "ECO-2025-014", summary: "Tightened melting point range" },
    ],
    effectivityStart: "2025-09-20",
    effectivityEnd: "2027-09-20",
    ecoNumber: "ECO-2025-014",
    ctq: false,
    traceabilityLevel: "batch",
    fieldFailureRate: [0.1, 0.1, 0.0, 0.1, 0.2, 0.1, 0.1, 0.0, 0.1, 0.2, 0.1, 0.0],
  },
  {
    partNumber: "PM-1001",
    partName: "HDPE Bottle 5L",
    currentRevision: "D",
    revisionHistory: [
      { rev: "A", date: "2023-01-15", eco: "ECO-2023-001", summary: "Initial release" },
      { rev: "B", date: "2023-08-10", eco: "ECO-2023-012", summary: "Wall thickness increase" },
      { rev: "C", date: "2024-05-20", eco: "ECO-2024-008", summary: "Cap thread redesign" },
      { rev: "D", date: "2025-10-05", eco: "ECO-2025-016", summary: "Added UV stabilizer to resin" },
    ],
    effectivityStart: "2025-10-05",
    effectivityEnd: "2027-10-05",
    ecoNumber: "ECO-2025-016",
    ctq: true,
    traceabilityLevel: "serial",
    fieldFailureRate: [0.5, 0.6, 0.4, 0.3, 0.2, 0.1, 0.1, 0.2, 0.3, 0.4, 0.2, 0.1],
  },
  {
    partNumber: "RM-5018",
    partName: "EDTA Disodium Salt",
    currentRevision: "A",
    revisionHistory: [
      { rev: "A", date: "2024-03-01", eco: "ECO-2024-004", summary: "Initial release" },
    ],
    effectivityStart: "2024-03-01",
    effectivityEnd: "2026-03-01",
    ecoNumber: "ECO-2024-004",
    ctq: false,
    traceabilityLevel: "lot",
    fieldFailureRate: [0.0, 0.0, 0.1, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0],
  },
  {
    partNumber: "RM-8012",
    partName: "Fragrance Blend FG-04",
    currentRevision: "B",
    revisionHistory: [
      { rev: "A", date: "2024-01-10", eco: "ECO-2024-002", summary: "Initial release" },
      { rev: "B", date: "2025-07-15", eco: "ECO-2025-011", summary: "Adjusted allergen limits per IFRA" },
    ],
    effectivityStart: "2025-07-15",
    effectivityEnd: "2027-07-15",
    ecoNumber: "ECO-2025-011",
    ctq: true,
    traceabilityLevel: "lot",
    fieldFailureRate: [0.1, 0.2, 0.3, 0.2, 0.1, 0.0, 0.1, 0.2, 0.1, 0.0, 0.1, 0.1],
  },
];

// --- Supplier Lots (SBOM layer) ---
export interface SupplierLot {
  internalLotNumber: string;
  supplierLotNumber: string;
  heatNumber: string;
  supplierId: string;
  supplierName: string;
  partNumber: string;
  goodsReceiptDate: string;
  quantity: string;
  inspectionStatus: "passed" | "failed" | "pending";
  cocReference: string;
  expiryDate: string;
  materialGrade: string;
  quarantine: boolean;
}

export const supplierLots: SupplierLot[] = [
  // SUSPECT LOT 1 — failed inspection, bad material grade
  {
    internalLotNumber: "LOT-2026-0189",
    supplierLotNumber: "GS-SLS-2026-044",
    heatNumber: "HN-88421",
    supplierId: "SUP-001",
    supplierName: "Galaxy Surfactants",
    partNumber: "RM-4023",
    goodsReceiptDate: "2026-02-18",
    quantity: "800 kg",
    inspectionStatus: "failed",
    cocReference: "CoC-GS-2026-044",
    expiryDate: "2027-02-18",
    materialGrade: "Industrial (spec requires Cosmetic)",
    quarantine: true,
  },
  // SUSPECT LOT 2 — non-ASL supplier
  {
    internalLotNumber: "LOT-2026-0204",
    supplierLotNumber: "JA-SA-2026-018",
    heatNumber: "HN-90112",
    supplierId: "SUP-011",
    supplierName: "Jayant Agro",
    partNumber: "RM-2087",
    goodsReceiptDate: "2026-03-05",
    quantity: "500 kg",
    inspectionStatus: "passed",
    cocReference: "CoC-JA-2026-018",
    expiryDate: "2027-03-05",
    materialGrade: "Technical Grade",
    quarantine: false,
  },
  // Clean lots
  {
    internalLotNumber: "LOT-2026-0178",
    supplierLotNumber: "GS-SLS-2026-039",
    heatNumber: "HN-87950",
    supplierId: "SUP-001",
    supplierName: "Galaxy Surfactants",
    partNumber: "RM-4023",
    goodsReceiptDate: "2026-02-10",
    quantity: "600 kg",
    inspectionStatus: "passed",
    cocReference: "CoC-GS-2026-039",
    expiryDate: "2027-02-10",
    materialGrade: "Cosmetic Grade",
    quarantine: false,
  },
  {
    internalLotNumber: "LOT-2026-0210",
    supplierLotNumber: "MT-HDPE-2026-055",
    heatNumber: "HN-91200",
    supplierId: "SUP-004",
    supplierName: "Mold-Tek Containers",
    partNumber: "PM-1001",
    goodsReceiptDate: "2026-03-10",
    quantity: "2,000 pcs",
    inspectionStatus: "passed",
    cocReference: "CoC-MT-2026-055",
    expiryDate: "2028-03-10",
    materialGrade: "HDPE UV-Stab",
    quarantine: false,
  },
  {
    internalLotNumber: "LOT-2026-0195",
    supplierLotNumber: "RC-SA-2026-022",
    heatNumber: "HN-89500",
    supplierId: "SUP-003",
    supplierName: "Rashtriya Chemicals",
    partNumber: "RM-2087",
    goodsReceiptDate: "2026-02-25",
    quantity: "400 kg",
    inspectionStatus: "passed",
    cocReference: "CoC-RC-2026-022",
    expiryDate: "2027-02-25",
    materialGrade: "Cosmetic Grade",
    quarantine: false,
  },
  {
    internalLotNumber: "LOT-2026-0215",
    supplierLotNumber: "AI-EDTA-2026-009",
    heatNumber: "HN-91800",
    supplierId: "SUP-002",
    supplierName: "Aarti Industries",
    partNumber: "RM-5018",
    goodsReceiptDate: "2026-03-12",
    quantity: "100 kg",
    inspectionStatus: "passed",
    cocReference: "CoC-AI-2026-009",
    expiryDate: "2027-03-12",
    materialGrade: "ACS Reagent",
    quarantine: false,
  },
];

// --- MBOM / As-built records ---
export interface AsBuiltRecord {
  unitSerial: string;
  workOrderId: string;
  assemblyDate: string;
  workCentre: string;
  operatorId: string;
  assemblyLine: string;
  lotsConsumed: { partNumber: string; lotNumber: string; station: string }[];
  qcResult: "pass" | "fail" | "conditional";
  processParams: { param: string; value: number; spec: string; inSpec: boolean }[];
  revisionUsedAtBuild: string; // EBOM revision used at build time
  partNumber: string; // main part assembled
}

export const asBuiltRecords: AsBuiltRecord[] = [
  // Clean trace — everything OK
  {
    unitSerial: "SN-2026-00451",
    workOrderId: "WO-2026-0855",
    assemblyDate: "2026-03-15",
    workCentre: "WC-01 Mixing",
    operatorId: "OP-045 Suresh P.",
    assemblyLine: "Line 1",
    lotsConsumed: [
      { partNumber: "RM-4023", lotNumber: "LOT-2026-0178", station: "Mixing" },
      { partNumber: "RM-2087", lotNumber: "LOT-2026-0195", station: "Mixing" },
      { partNumber: "PM-1001", lotNumber: "LOT-2026-0210", station: "Filling" },
    ],
    qcResult: "pass",
    processParams: [
      { param: "Mix Temperature", value: 72, spec: "65–80°C", inSpec: true },
      { param: "Mix Speed", value: 450, spec: "400–500 RPM", inSpec: true },
      { param: "Fill Volume", value: 5.02, spec: "4.95–5.10 L", inSpec: true },
    ],
    revisionUsedAtBuild: "C",
    partNumber: "RM-4023",
  },
  // Revision mismatch — built with old revision
  {
    unitSerial: "SN-2026-00467",
    workOrderId: "WO-2026-0862",
    assemblyDate: "2026-03-18",
    workCentre: "WC-01 Mixing",
    operatorId: "OP-023 Anita D.",
    assemblyLine: "Line 2",
    lotsConsumed: [
      { partNumber: "RM-4023", lotNumber: "LOT-2026-0189", station: "Mixing" }, // suspect lot!
      { partNumber: "RM-2087", lotNumber: "LOT-2026-0204", station: "Mixing" }, // non-ASL lot!
      { partNumber: "PM-1001", lotNumber: "LOT-2026-0210", station: "Filling" },
    ],
    qcResult: "conditional",
    processParams: [
      { param: "Mix Temperature", value: 83, spec: "65–80°C", inSpec: false }, // out of spec!
      { param: "Mix Speed", value: 460, spec: "400–500 RPM", inSpec: true },
      { param: "Fill Volume", value: 5.08, spec: "4.95–5.10 L", inSpec: true },
    ],
    revisionUsedAtBuild: "B", // old revision — current is C
    partNumber: "RM-4023",
  },
  // Process deviation — parameter out of spec
  {
    unitSerial: "SN-2026-00472",
    workOrderId: "WO-2026-0865",
    assemblyDate: "2026-03-19",
    workCentre: "WC-02 Filling",
    operatorId: "OP-067 Mohan K.",
    assemblyLine: "Line 1",
    lotsConsumed: [
      { partNumber: "RM-4023", lotNumber: "LOT-2026-0189", station: "Mixing" }, // suspect lot again
      { partNumber: "RM-5018", lotNumber: "LOT-2026-0215", station: "Mixing" },
      { partNumber: "PM-1001", lotNumber: "LOT-2026-0210", station: "Filling" },
    ],
    qcResult: "fail",
    processParams: [
      { param: "Mix Temperature", value: 78, spec: "65–80°C", inSpec: true },
      { param: "Mix Speed", value: 520, spec: "400–500 RPM", inSpec: false }, // out of spec
      { param: "Fill Volume", value: 4.88, spec: "4.95–5.10 L", inSpec: false }, // out of spec
    ],
    revisionUsedAtBuild: "C",
    partNumber: "RM-4023",
  },
];

// --- Warranty Claims ---
export interface WarrantyClaim {
  claimId: string;
  unitSerial: string;
  claimDate: string;
  customer: string;
  defectDescription: string;
  rootCauseLotNumber: string;
  status: "open" | "investigating" | "closed";
  rcaTimeHours: number;
}

export const warrantyClaims: WarrantyClaim[] = [
  {
    claimId: "WC-2026-0034",
    unitSerial: "SN-2026-00467",
    claimDate: "2026-03-22",
    customer: "Reliance Retail",
    defectDescription: "Product discoloration and off-odour detected by end customer",
    rootCauseLotNumber: "LOT-2026-0189",
    status: "investigating",
    rcaTimeHours: 14,
  },
  {
    claimId: "WC-2026-0035",
    unitSerial: "SN-2026-00472",
    claimDate: "2026-03-23",
    customer: "DMart",
    defectDescription: "Underfill — bottle volume below label claim (4.88L vs 5L)",
    rootCauseLotNumber: "LOT-2026-0189",
    status: "open",
    rcaTimeHours: 8,
  },
  {
    claimId: "WC-2026-0031",
    unitSerial: "SN-2026-00467",
    claimDate: "2026-03-20",
    customer: "BigBasket",
    defectDescription: "Skin irritation complaint — possible surfactant contamination",
    rootCauseLotNumber: "LOT-2026-0189",
    status: "investigating",
    rcaTimeHours: 22,
  },
];

// --- Traceability Alerts ---
export interface TraceabilityAlert {
  id: string;
  type: "suspect-lot" | "revision-mismatch" | "scan-coverage" | "non-asl" | "field-cluster" | "eco-approaching" | "lot-expiry";
  severity: "critical" | "high" | "medium";
  title: string;
  description: string;
  timestamp: string;
  relatedLot?: string;
  relatedSerial?: string;
  relatedPart?: string;
  resolved: boolean;
}

export const traceabilityAlerts: TraceabilityAlert[] = [
  {
    id: "TA-001",
    type: "suspect-lot",
    severity: "critical",
    title: "Suspect lot LOT-2026-0189 in active production",
    description: "Failed incoming inspection (material grade mismatch). Lot consumed in WO-2026-0862 and WO-2026-0865. 3 warranty claims linked.",
    timestamp: "2026-03-22T08:30:00",
    relatedLot: "LOT-2026-0189",
    relatedPart: "RM-4023",
    resolved: false,
  },
  {
    id: "TA-002",
    type: "revision-mismatch",
    severity: "critical",
    title: "Revision mismatch at assembly — SN-2026-00467",
    description: "Unit built using EBOM Rev B but current active revision is Rev C (ECO-2025-018). Heavy metals limit spec missing from build.",
    timestamp: "2026-03-18T14:15:00",
    relatedSerial: "SN-2026-00467",
    relatedPart: "RM-4023",
    resolved: false,
  },
  {
    id: "TA-003",
    type: "non-asl",
    severity: "high",
    title: "Non-ASL supplier lot consumed — LOT-2026-0204",
    description: "Stearic Acid from Jayant Agro (not on Approved Supplier List) consumed in WO-2026-0862.",
    timestamp: "2026-03-18T15:00:00",
    relatedLot: "LOT-2026-0204",
    relatedPart: "RM-2087",
    resolved: false,
  },
  {
    id: "TA-004",
    type: "field-cluster",
    severity: "high",
    title: "Field return cluster on LOT-2026-0189",
    description: "3 warranty claims in 4 days all trace back to lot LOT-2026-0189 from Galaxy Surfactants.",
    timestamp: "2026-03-23T10:00:00",
    relatedLot: "LOT-2026-0189",
    resolved: false,
  },
  {
    id: "TA-005",
    type: "scan-coverage",
    severity: "high",
    title: "Lot scan coverage below 90% threshold — Line 3",
    description: "Line 3 scan coverage at 74% for shift B (22 Mar). 8 CTQ stations missed scans.",
    timestamp: "2026-03-22T22:00:00",
    resolved: false,
  },
  {
    id: "TA-006",
    type: "eco-approaching",
    severity: "medium",
    title: "ECO-2024-004 effectivity ending — RM-5018",
    description: "EDTA Disodium Salt Rev A effectivity ends 2026-03-01. No updated revision released yet.",
    timestamp: "2026-03-15T09:00:00",
    relatedPart: "RM-5018",
    resolved: false,
  },
  {
    id: "TA-007",
    type: "lot-expiry",
    severity: "medium",
    title: "Supplier lot approaching expiry — LOT-2026-0178",
    description: "SLS lot from Galaxy Surfactants expires 2027-02-10. 120 kg remaining, consume within 30 days.",
    timestamp: "2026-03-20T07:00:00",
    relatedLot: "LOT-2026-0178",
    resolved: false,
  },
];

// --- Population at Risk data ---
export interface PopulationAtRiskScenario {
  lotNumber: string;
  supplier: string;
  assemblyLine: string;
  dateRange: string;
  funnel: {
    totalProduced: number;
    lotUsedInBuild: number;
    assembledPassedQC: number;
    shippedToField: number;
    atRiskInField: number;
  };
  alreadyReturned: number;
}

export const populationAtRiskData: PopulationAtRiskScenario[] = [
  {
    lotNumber: "LOT-2026-0189",
    supplier: "Galaxy Surfactants",
    assemblyLine: "Line 1",
    dateRange: "2026-03-15 to 2026-03-20",
    funnel: {
      totalProduced: 12400,
      lotUsedInBuild: 3200,
      assembledPassedQC: 2800,
      shippedToField: 2100,
      atRiskInField: 1850,
    },
    alreadyReturned: 3,
  },
  {
    lotNumber: "LOT-2026-0189",
    supplier: "Galaxy Surfactants",
    assemblyLine: "Line 2",
    dateRange: "2026-03-16 to 2026-03-19",
    funnel: {
      totalProduced: 8600,
      lotUsedInBuild: 2100,
      assembledPassedQC: 1900,
      shippedToField: 1400,
      atRiskInField: 1250,
    },
    alreadyReturned: 2,
  },
  {
    lotNumber: "LOT-2026-0204",
    supplier: "Jayant Agro",
    assemblyLine: "Line 2",
    dateRange: "2026-03-18 to 2026-03-19",
    funnel: {
      totalProduced: 8600,
      lotUsedInBuild: 1800,
      assembledPassedQC: 1700,
      shippedToField: 1200,
      atRiskInField: 1050,
    },
    alreadyReturned: 0,
  },
];

// --- Supplier Quality Heatmap Data ---
export const supplierQualityMonthly: Record<string, number[]> = {
  "Galaxy Surfactants": [1.2, 1.5, 1.8, 2.1, 1.9, 2.4, 3.1, 4.2, 5.8, 3.5, 2.8, 2.1],
  "Aarti Industries": [1.0, 0.8, 1.2, 1.5, 1.1, 0.9, 1.3, 1.8, 1.4, 1.2, 1.0, 1.8],
  "Rashtriya Chemicals": [2.5, 2.8, 3.2, 3.5, 4.1, 3.8, 3.2, 2.9, 2.5, 3.5, 3.8, 3.5],
  "Mold-Tek Containers": [0.3, 0.2, 0.5, 0.4, 0.3, 0.5, 0.2, 0.3, 0.4, 0.5, 0.3, 0.5],
  "Tronox India": [1.8, 2.2, 2.5, 2.8, 3.0, 2.6, 2.2, 2.8, 3.1, 2.5, 2.8, 2.8],
  "Uflex Packaging": [0.5, 0.4, 0.8, 0.6, 0.5, 0.7, 0.8, 0.6, 0.5, 0.8, 0.7, 0.8],
  "Deepak Nitrite": [1.0, 1.2, 1.5, 1.3, 1.1, 1.4, 1.5, 1.2, 1.0, 1.5, 1.3, 1.5],
  "Givaudan India": [0.1, 0.2, 0.3, 0.2, 0.1, 0.3, 0.2, 0.1, 0.3, 0.2, 0.3, 0.3],
};

export const heatmapMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

// --- Top Parts by COPQ ---
export interface COPQPart {
  partNumber: string;
  partName: string;
  supplier: string;
  defectRate: number;
  copqYTD: string;
  lotNumber: string;
}

export const topPartsByCOPQ: COPQPart[] = [
  { partNumber: "RM-4023", partName: "Sodium Lauryl Sulphate", supplier: "Galaxy Surfactants", defectRate: 5.8, copqYTD: "₹4.2L", lotNumber: "LOT-2026-0189" },
  { partNumber: "RM-2087", partName: "Stearic Acid", supplier: "Rashtriya Chemicals", defectRate: 3.5, copqYTD: "₹2.8L", lotNumber: "LOT-2026-0195" },
  { partNumber: "RM-5018", partName: "EDTA Disodium Salt", supplier: "Aarti Industries", defectRate: 1.8, copqYTD: "₹1.1L", lotNumber: "LOT-2026-0215" },
  { partNumber: "PM-1001", partName: "HDPE Bottle 5L", supplier: "Mold-Tek Containers", defectRate: 0.5, copqYTD: "₹0.6L", lotNumber: "LOT-2026-0210" },
  { partNumber: "RM-8012", partName: "Fragrance Blend FG-04", supplier: "Givaudan India", defectRate: 0.3, copqYTD: "₹0.3L", lotNumber: "LOT-2026-0178" },
];

// --- Missing Scan Exceptions (for Dashboard) ---
export interface MissingScanException {
  workOrder: string;
  part: string;
  station: string;
  shift: string;
  date: string;
  resolved: boolean;
}

export const missingScanExceptions: MissingScanException[] = [
  { workOrder: "WO-2026-0862", part: "RM-4023", station: "Mixing Station A", shift: "Shift A", date: "2026-03-18", resolved: false },
  { workOrder: "WO-2026-0865", part: "PM-1001", station: "Filling Station B", shift: "Shift B", date: "2026-03-19", resolved: false },
  { workOrder: "WO-2026-0870", part: "RM-8012", station: "Fragrance Addition", shift: "Shift A", date: "2026-03-20", resolved: false },
  { workOrder: "WO-2026-0872", part: "RM-2087", station: "Mixing Station A", shift: "Shift B", date: "2026-03-20", resolved: true },
  { workOrder: "WO-2026-0878", part: "RM-4023", station: "QC Sampling", shift: "Shift A", date: "2026-03-21", resolved: false },
  { workOrder: "WO-2026-0880", part: "PM-1001", station: "Filling Station A", shift: "Shift C", date: "2026-03-22", resolved: false },
];

// --- Trace completeness by assembly line (for Dashboard chart) ---
export const traceCompletenessByLine = [
  { day: "17 Mar", "Line 1": 98, "Line 2": 92, "Line 3": 74, "Line 4": 96 },
  { day: "18 Mar", "Line 1": 97, "Line 2": 88, "Line 3": 71, "Line 4": 95 },
  { day: "19 Mar", "Line 1": 99, "Line 2": 90, "Line 3": 78, "Line 4": 97 },
  { day: "20 Mar", "Line 1": 96, "Line 2": 85, "Line 3": 72, "Line 4": 94 },
  { day: "21 Mar", "Line 1": 98, "Line 2": 91, "Line 3": 76, "Line 4": 96 },
  { day: "22 Mar", "Line 1": 97, "Line 2": 87, "Line 3": 74, "Line 4": 95 },
  { day: "23 Mar", "Line 1": 99, "Line 2": 93, "Line 3": 80, "Line 4": 98 },
];

// --- Lot scan simulator station config ---
export const assemblyStations = [
  { id: "station-1", name: "Raw Material Intake", ctq: false },
  { id: "station-2", name: "Mixing Station A", ctq: true },
  { id: "station-3", name: "Fragrance Addition", ctq: true },
  { id: "station-4", name: "QC Sampling", ctq: true },
  { id: "station-5", name: "Filling Station", ctq: false },
  { id: "station-6", name: "Capping & Sealing", ctq: false },
  { id: "station-7", name: "Labelling", ctq: false },
  { id: "station-8", name: "Final Inspection", ctq: true },
];

// --- Approved supplier list for validation ---
export const approvedSupplierLots = supplierLots
  .filter(l => {
    const supplier = suppliers.find(s => s.id === l.supplierId);
    return supplier?.asl && l.inspectionStatus === "passed" && !l.quarantine;
  })
  .map(l => l.internalLotNumber);
