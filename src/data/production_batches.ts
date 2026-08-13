// Finished Goods Production Batches — linked to RM batches, sales orders

export interface QCParameter {
  parameter: string;
  spec: string;
  result: string;
  status: "Pass" | "Fail";
}

export interface RMConsumption {
  rm_batch_number: string;
  material_code: string;
  material_name: string;
  quantity_used: number;
  unit: string;
}

export interface ProductionBatch {
  batch_number: string;
  product_code: string;
  product_name: string;
  formula_code: string;
  formula_revision: string;
  production_date: string;
  expiry_date: string;
  quantity_produced: number;
  quantity_dispatched: number;
  quantity_remaining: number;
  unit: string;
  warehouse: string;
  bin: string;
  qc_status: "Approved" | "Quarantine" | "Pending" | "Failed";
  qc_lot_number: string;
  qc_date: string;
  qc_result: QCParameter[];
  rm_consumption: RMConsumption[];
  pm_consumption: RMConsumption[];
}

export const productionBatches: ProductionBatch[] = [
  {
    batch_number: "B-2026-0412", product_code: "FG-IC-5L", product_name: "Industrial Cleaner 5L",
    formula_code: "FRM-IC5L", formula_revision: "v3.2", production_date: "2026-03-18", expiry_date: "2028-03-18",
    quantity_produced: 1800, quantity_dispatched: 1300, quantity_remaining: 500, unit: "units",
    warehouse: "Pune Plant", bin: "FG-A12",
    qc_status: "Approved", qc_lot_number: "QC-2026-0412", qc_date: "2026-03-18",
    qc_result: [
      { parameter: "Active Content", spec: "≥15%", result: "16.2%", status: "Pass" },
      { parameter: "pH (1% solution)", spec: "7.0–9.0", result: "7.8", status: "Pass" },
      { parameter: "Viscosity", spec: "800–1200 cPs", result: "1050 cPs", status: "Pass" },
      { parameter: "Appearance", spec: "Clear, no sediment", result: "Clear, no sediment", status: "Pass" },
      { parameter: "Fragrance", spec: "Characteristic", result: "Characteristic", status: "Pass" },
    ],
    rm_consumption: [
      { rm_batch_number: "RM-B-4023-0089", material_code: "RM-4023", material_name: "Sodium Lauryl Sulphate", quantity_used: 640, unit: "kg" },
      { rm_batch_number: "RM-B-5018-0045", material_code: "RM-5018", material_name: "EDTA Disodium Salt", quantity_used: 36, unit: "kg" },
      { rm_batch_number: "RM-B-7044-0201", material_code: "RM-7044", material_name: "Demineralised Water", quantity_used: 3600, unit: "L" },
      { rm_batch_number: "RM-B-8012-0015", material_code: "RM-8012", material_name: "Fragrance Blend FG-04", quantity_used: 18, unit: "L" },
    ],
    pm_consumption: [
      { rm_batch_number: "PM-B-1001-0120", material_code: "PM-1001", material_name: "HDPE Bottle 5L", quantity_used: 1800, unit: "pcs" },
    ],
  },
  {
    batch_number: "B-2026-0408", product_code: "FG-FP-1L", product_name: "Floor Polish 1L",
    formula_code: "FRM-FP1L", formula_revision: "v2.1", production_date: "2026-03-15", expiry_date: "2027-09-15",
    quantity_produced: 4200, quantity_dispatched: 3800, quantity_remaining: 400, unit: "units",
    warehouse: "Mumbai WH", bin: "FG-B04",
    qc_status: "Approved", qc_lot_number: "QC-2026-0408", qc_date: "2026-03-15",
    qc_result: [
      { parameter: "Gloss Level", spec: "≥80 GU", result: "88 GU", status: "Pass" },
      { parameter: "Drying Time", spec: "≤30 min", result: "22 min", status: "Pass" },
      { parameter: "Slip Resistance", spec: "CoF ≥ 0.5", result: "0.62", status: "Pass" },
    ],
    rm_consumption: [
      { rm_batch_number: "RM-B-2087-0033", material_code: "RM-2087", material_name: "Stearic Acid", quantity_used: 180, unit: "kg" },
      { rm_batch_number: "RM-B-7044-0201", material_code: "RM-7044", material_name: "Demineralised Water", quantity_used: 600, unit: "L" },
    ],
    pm_consumption: [],
  },
  {
    batch_number: "B-2026-0401", product_code: "FG-HW-250", product_name: "Hand Wash 250ml",
    formula_code: "FRM-HW250", formula_revision: "v4.0", production_date: "2026-03-12", expiry_date: "2028-03-12",
    quantity_produced: 8500, quantity_dispatched: 7200, quantity_remaining: 1300, unit: "units",
    warehouse: "Pune Plant", bin: "FG-C08",
    qc_status: "Approved", qc_lot_number: "QC-2026-0401", qc_date: "2026-03-12",
    qc_result: [
      { parameter: "Active Content", spec: "≥0.5%", result: "0.62%", status: "Pass" },
      { parameter: "pH", spec: "5.0–7.0", result: "5.8", status: "Pass" },
      { parameter: "Viscosity", spec: "3000–5000 cPs", result: "4200 cPs", status: "Pass" },
    ],
    rm_consumption: [
      { rm_batch_number: "RM-B-4023-0089", material_code: "RM-4023", material_name: "Sodium Lauryl Sulphate", quantity_used: 85, unit: "kg" },
      { rm_batch_number: "RM-B-8012-0015", material_code: "RM-8012", material_name: "Fragrance Blend FG-04", quantity_used: 8, unit: "L" },
    ],
    pm_consumption: [],
  },
  {
    batch_number: "B-2026-0395", product_code: "FG-DW-500", product_name: "Dish Wash 500ml",
    formula_code: "FRM-DW500", formula_revision: "v2.4", production_date: "2026-03-10", expiry_date: "2028-03-10",
    quantity_produced: 3100, quantity_dispatched: 1800, quantity_remaining: 1300, unit: "units",
    warehouse: "Delhi Depot", bin: "FG-A02",
    qc_status: "Quarantine", qc_lot_number: "QC-2026-0395", qc_date: "2026-03-10",
    qc_result: [
      { parameter: "Active Content", spec: "≥12%", result: "9.8%", status: "Fail" },
      { parameter: "pH", spec: "6.5–8.5", result: "8.9", status: "Fail" },
      { parameter: "Foam Height", spec: "≥150 mm", result: "120 mm", status: "Fail" },
      { parameter: "Viscosity", spec: "600–1000 cPs", result: "780 cPs", status: "Pass" },
    ],
    rm_consumption: [
      { rm_batch_number: "RM-B-4023-0092", material_code: "RM-4023", material_name: "Sodium Lauryl Sulphate", quantity_used: 280, unit: "kg" },
      { rm_batch_number: "RM-B-2087-0041", material_code: "RM-2087", material_name: "Stearic Acid", quantity_used: 95, unit: "kg" },
      { rm_batch_number: "RM-B-5018-0045", material_code: "RM-5018", material_name: "EDTA Disodium Salt", quantity_used: 18, unit: "kg" },
    ],
    pm_consumption: [],
  },
  {
    batch_number: "B-2026-0388", product_code: "FG-GC-1L", product_name: "Glass Cleaner 1L",
    formula_code: "FRM-GC1L", formula_revision: "v1.5", production_date: "2026-03-08", expiry_date: "2028-03-08",
    quantity_produced: 2600, quantity_dispatched: 2200, quantity_remaining: 400, unit: "units",
    warehouse: "Pune Plant", bin: "FG-D11",
    qc_status: "Approved", qc_lot_number: "QC-2026-0388", qc_date: "2026-03-08",
    qc_result: [
      { parameter: "Streak-free", spec: "No streaks", result: "No streaks", status: "Pass" },
      { parameter: "pH", spec: "9.0–11.0", result: "10.2", status: "Pass" },
    ],
    rm_consumption: [
      { rm_batch_number: "RM-B-7044-0201", material_code: "RM-7044", material_name: "Demineralised Water", quantity_used: 1800, unit: "L" },
    ],
    pm_consumption: [],
  },
  {
    batch_number: "B-2026-0380", product_code: "FG-TC-500", product_name: "Toilet Cleaner 500ml",
    formula_code: "FRM-TC500", formula_revision: "v3.0", production_date: "2026-03-05", expiry_date: "2027-09-05",
    quantity_produced: 5800, quantity_dispatched: 5100, quantity_remaining: 700, unit: "units",
    warehouse: "Chennai Hub", bin: "FG-B07",
    qc_status: "Approved", qc_lot_number: "QC-2026-0380", qc_date: "2026-03-05",
    qc_result: [
      { parameter: "Active Chlorine", spec: "≥2.5%", result: "2.8%", status: "Pass" },
      { parameter: "pH", spec: "≤2.0", result: "1.6", status: "Pass" },
      { parameter: "Viscosity", spec: "400–800 cPs", result: "620 cPs", status: "Pass" },
    ],
    rm_consumption: [
      { rm_batch_number: "RM-B-2087-0033", material_code: "RM-2087", material_name: "Stearic Acid", quantity_used: 140, unit: "kg" },
    ],
    pm_consumption: [],
  },
  {
    batch_number: "B-2026-0371", product_code: "FG-SD-5L", product_name: "Surface Disinfectant 5L",
    formula_code: "FRM-SD5L", formula_revision: "v2.0", production_date: "2026-03-01", expiry_date: "2028-03-01",
    quantity_produced: 1200, quantity_dispatched: 950, quantity_remaining: 250, unit: "units",
    warehouse: "Pune Plant", bin: "FG-A15",
    qc_status: "Approved", qc_lot_number: "QC-2026-0371", qc_date: "2026-03-01",
    qc_result: [
      { parameter: "Bactericidal Efficacy", spec: "99.9% kill", result: "99.97% kill", status: "Pass" },
      { parameter: "pH", spec: "6.0–8.0", result: "7.2", status: "Pass" },
    ],
    rm_consumption: [
      { rm_batch_number: "RM-B-5018-0045", material_code: "RM-5018", material_name: "EDTA Disodium Salt", quantity_used: 18, unit: "kg" },
      { rm_batch_number: "RM-B-8012-0015", material_code: "RM-8012", material_name: "Fragrance Blend FG-04", quantity_used: 12, unit: "L" },
    ],
    pm_consumption: [],
  },
  {
    batch_number: "B-2025-1245", product_code: "FG-BC-500", product_name: "Bathroom Cleaner 500ml",
    formula_code: "FRM-BC500", formula_revision: "v1.8", production_date: "2025-12-15", expiry_date: "2026-04-15",
    quantity_produced: 420, quantity_dispatched: 380, quantity_remaining: 40, unit: "units",
    warehouse: "Mumbai WH", bin: "FG-C03",
    qc_status: "Approved", qc_lot_number: "QC-2025-1245", qc_date: "2025-12-15",
    qc_result: [
      { parameter: "Active Content", spec: "≥8%", result: "8.5%", status: "Pass" },
      { parameter: "pH", spec: "≤3.0", result: "2.4", status: "Pass" },
    ],
    rm_consumption: [
      { rm_batch_number: "RM-B-2087-0033", material_code: "RM-2087", material_name: "Stearic Acid", quantity_used: 15, unit: "kg" },
    ],
    pm_consumption: [],
  },
];

export const getProductionBatch = (batchNumber: string) => productionBatches.find(b => b.batch_number === batchNumber);
export const getBatchesByRMBatch = (rmBatch: string) => productionBatches.filter(b =>
  b.rm_consumption.some(r => r.rm_batch_number === rmBatch) || b.pm_consumption.some(p => p.rm_batch_number === rmBatch)
);
