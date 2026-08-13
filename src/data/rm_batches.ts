// Raw Material & Packaging Material Batches — linked to GRNs, POs, and vendors

export interface RMBatch {
  batch_number: string;
  material_code: string;
  material_name: string;
  material_type: "RM" | "PM";
  grn_number: string;
  po_number: string;
  vendor_id: string;
  vendor_name: string;
  supplier_lot_number: string;
  quantity_received: number;
  quantity_consumed: number;
  quantity_remaining: number;
  unit: string;
  receipt_date: string;
  expiry_date: string;
  storage_location: string;
  bin: string;
  qc_status: "Approved" | "Quarantine" | "Pending" | "Rejected";
  coa_reference: string;
  release_date: string;
  released_by: string;
}

export const rmBatches: RMBatch[] = [
  {
    batch_number: "RM-B-4023-0089", material_code: "RM-4023", material_name: "Sodium Lauryl Sulphate", material_type: "RM",
    grn_number: "GRN-2026-0312", po_number: "PO-2026-0198", vendor_id: "SUP-001", vendor_name: "Galaxy Surfactants",
    supplier_lot_number: "GS-SLS-2026-039", quantity_received: 640, quantity_consumed: 640, quantity_remaining: 0, unit: "kg",
    receipt_date: "2026-02-15", expiry_date: "2027-02-15", storage_location: "Pune Plant", bin: "RM-A01",
    qc_status: "Approved", coa_reference: "CoC-GS-2026-039", release_date: "2026-02-16", released_by: "QC-Dinesh K.",
  },
  {
    batch_number: "RM-B-4023-0092", material_code: "RM-4023", material_name: "Sodium Lauryl Sulphate", material_type: "RM",
    grn_number: "GRN-2026-0318", po_number: "PO-2026-0198", vendor_id: "SUP-001", vendor_name: "Galaxy Surfactants",
    supplier_lot_number: "GS-SLS-2026-044", quantity_received: 560, quantity_consumed: 460, quantity_remaining: 100, unit: "kg",
    receipt_date: "2026-02-18", expiry_date: "2027-02-18", storage_location: "Pune Plant", bin: "QRN-01",
    qc_status: "Quarantine", coa_reference: "CoC-GS-2026-044", release_date: "", released_by: "",
  },
  {
    batch_number: "RM-B-5018-0045", material_code: "RM-5018", material_name: "EDTA Disodium Salt", material_type: "RM",
    grn_number: "GRN-2026-0298", po_number: "PO-2026-0195", vendor_id: "SUP-002", vendor_name: "Aarti Industries",
    supplier_lot_number: "AI-EDTA-2026-009", quantity_received: 96, quantity_consumed: 72, quantity_remaining: 24, unit: "kg",
    receipt_date: "2026-02-20", expiry_date: "2027-02-20", storage_location: "Pune Plant", bin: "RM-C04",
    qc_status: "Approved", coa_reference: "CoC-AI-2026-009", release_date: "2026-02-21", released_by: "QC-Dinesh K.",
  },
  {
    batch_number: "RM-B-7044-0201", material_code: "RM-7044", material_name: "Demineralised Water", material_type: "RM",
    grn_number: "GRN-2026-0305", po_number: "PO-2026-0185", vendor_id: "SUP-005", vendor_name: "Aqua Pure Systems",
    supplier_lot_number: "AP-DW-2026-015", quantity_received: 5000, quantity_consumed: 4200, quantity_remaining: 800, unit: "L",
    receipt_date: "2026-02-10", expiry_date: "2026-08-10", storage_location: "Pune Plant", bin: "TANK-01",
    qc_status: "Approved", coa_reference: "CoC-AP-2026-015", release_date: "2026-02-10", released_by: "QC-Rekha M.",
  },
  {
    batch_number: "PM-B-1001-0120", material_code: "PM-1001", material_name: "HDPE Bottle 5L", material_type: "PM",
    grn_number: "GRN-2026-0310", po_number: "PO-2026-0192", vendor_id: "SUP-004", vendor_name: "Mold-Tek Containers",
    supplier_lot_number: "MT-HDPE-2026-055", quantity_received: 2000, quantity_consumed: 1800, quantity_remaining: 200, unit: "pcs",
    receipt_date: "2026-03-01", expiry_date: "2028-03-01", storage_location: "Pune Plant", bin: "PM-A01",
    qc_status: "Approved", coa_reference: "CoC-MT-2026-055", release_date: "2026-03-02", released_by: "QC-Rekha M.",
  },
  {
    batch_number: "RM-B-2087-0033", material_code: "RM-2087", material_name: "Stearic Acid", material_type: "RM",
    grn_number: "GRN-2026-0308", po_number: "PO-2026-0189", vendor_id: "SUP-003", vendor_name: "Rashtriya Chemicals",
    supplier_lot_number: "RC-SA-2026-022", quantity_received: 400, quantity_consumed: 320, quantity_remaining: 80, unit: "kg",
    receipt_date: "2026-02-25", expiry_date: "2027-02-25", storage_location: "Pune Plant", bin: "RM-B03",
    qc_status: "Approved", coa_reference: "CoC-RC-2026-022", release_date: "2026-02-26", released_by: "QC-Dinesh K.",
  },
  {
    batch_number: "RM-B-2087-0041", material_code: "RM-2087", material_name: "Stearic Acid", material_type: "RM",
    grn_number: "GRN-2026-0322", po_number: "PO-2026-0201", vendor_id: "SUP-011", vendor_name: "Jayant Agro",
    supplier_lot_number: "JA-SA-2026-018", quantity_received: 500, quantity_consumed: 380, quantity_remaining: 120, unit: "kg",
    receipt_date: "2026-03-05", expiry_date: "2027-03-05", storage_location: "Pune Plant", bin: "RM-B05",
    qc_status: "Approved", coa_reference: "CoC-JA-2026-018", release_date: "2026-03-06", released_by: "QC-Dinesh K.",
  },
  {
    batch_number: "RM-B-8012-0015", material_code: "RM-8012", material_name: "Fragrance Blend FG-04", material_type: "RM",
    grn_number: "GRN-2026-0328", po_number: "PO-2026-0208", vendor_id: "SUP-008", vendor_name: "Givaudan India",
    supplier_lot_number: "GI-FG04-2026-003", quantity_received: 50, quantity_consumed: 38, quantity_remaining: 12, unit: "L",
    receipt_date: "2026-03-15", expiry_date: "2027-03-15", storage_location: "Pune Plant", bin: "RM-D02",
    qc_status: "Approved", coa_reference: "CoC-GI-2026-003", release_date: "2026-03-16", released_by: "QC-Rekha M.",
  },
];

export const getRMBatch = (batchNumber: string) => rmBatches.find(b => b.batch_number === batchNumber);
