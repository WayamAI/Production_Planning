// Goods Receipt Notes — linked to POs, vendors, and RM batches

export interface GRNLineItem {
  material_code: string;
  material_name: string;
  material_type: "RM" | "PM";
  quantity: number;
  unit: string;
  rm_batch_number: string; // internal batch assigned at receipt — FK to rm_batches
  supplier_lot_number: string;
  heat_number: string;
  coa_reference: string;
  coa_parameters: Record<string, string>;
  inspection_status: "pending" | "passed" | "failed" | "quarantine";
  inspection_date: string;
  inspector_name: string;
  storage_location: string;
  bin: string;
}

export interface GRN {
  grn_number: string;
  purchase_order_number: string;
  vendor_id: string;
  vendor_name: string;
  grn_date: string;
  line_items: GRNLineItem[];
}

export const grns: GRN[] = [
  {
    grn_number: "GRN-2026-0312", purchase_order_number: "PO-2026-0198",
    vendor_id: "SUP-001", vendor_name: "Galaxy Surfactants", grn_date: "2026-02-15",
    line_items: [{
      material_code: "RM-4023", material_name: "Sodium Lauryl Sulphate", material_type: "RM",
      quantity: 640, unit: "kg", rm_batch_number: "RM-B-4023-0089",
      supplier_lot_number: "GS-SLS-2026-039", heat_number: "HN-87950",
      coa_reference: "CoC-GS-2026-039",
      coa_parameters: { active_content_percent: "96.2%", ph: "7.4", moisture_percent: "1.8%", appearance: "White powder" },
      inspection_status: "passed", inspection_date: "2026-02-16", inspector_name: "QC-Dinesh K.",
      storage_location: "Pune Plant", bin: "RM-A01",
    }],
  },
  {
    grn_number: "GRN-2026-0318", purchase_order_number: "PO-2026-0198",
    vendor_id: "SUP-001", vendor_name: "Galaxy Surfactants", grn_date: "2026-02-18",
    line_items: [{
      material_code: "RM-4023", material_name: "Sodium Lauryl Sulphate", material_type: "RM",
      quantity: 560, unit: "kg", rm_batch_number: "RM-B-4023-0092",
      supplier_lot_number: "GS-SLS-2026-044", heat_number: "HN-88421",
      coa_reference: "CoC-GS-2026-044",
      coa_parameters: { active_content_percent: "89.1%", ph: "8.2", moisture_percent: "4.5%", appearance: "Off-white powder, slight odour" },
      inspection_status: "failed", inspection_date: "2026-02-19", inspector_name: "QC-Rekha M.",
      storage_location: "Pune Plant", bin: "QRN-01",
    }],
  },
  {
    grn_number: "GRN-2026-0298", purchase_order_number: "PO-2026-0195",
    vendor_id: "SUP-002", vendor_name: "Aarti Industries", grn_date: "2026-02-20",
    line_items: [{
      material_code: "RM-5018", material_name: "EDTA Disodium Salt", material_type: "RM",
      quantity: 96, unit: "kg", rm_batch_number: "RM-B-5018-0045",
      supplier_lot_number: "AI-EDTA-2026-009", heat_number: "HN-91800",
      coa_reference: "CoC-AI-2026-009",
      coa_parameters: { active_content_percent: "99.1%", ph: "4.8", moisture_percent: "0.3%", appearance: "White crystalline powder" },
      inspection_status: "passed", inspection_date: "2026-02-21", inspector_name: "QC-Dinesh K.",
      storage_location: "Pune Plant", bin: "RM-C04",
    }],
  },
  {
    grn_number: "GRN-2026-0305", purchase_order_number: "PO-2026-0185",
    vendor_id: "SUP-005", vendor_name: "Aqua Pure Systems", grn_date: "2026-02-10",
    line_items: [{
      material_code: "RM-7044", material_name: "Demineralised Water", material_type: "RM",
      quantity: 5000, unit: "L", rm_batch_number: "RM-B-7044-0201",
      supplier_lot_number: "AP-DW-2026-015", heat_number: "—",
      coa_reference: "CoC-AP-2026-015",
      coa_parameters: { conductivity: "0.8 µS/cm", ph: "6.9", total_dissolved_solids: "2 ppm", appearance: "Clear colourless" },
      inspection_status: "passed", inspection_date: "2026-02-10", inspector_name: "QC-Rekha M.",
      storage_location: "Pune Plant", bin: "TANK-01",
    }],
  },
  {
    grn_number: "GRN-2026-0308", purchase_order_number: "PO-2026-0189",
    vendor_id: "SUP-003", vendor_name: "Rashtriya Chemicals", grn_date: "2026-02-25",
    line_items: [{
      material_code: "RM-2087", material_name: "Stearic Acid", material_type: "RM",
      quantity: 400, unit: "kg", rm_batch_number: "RM-B-2087-0033",
      supplier_lot_number: "RC-SA-2026-022", heat_number: "HN-89500",
      coa_reference: "CoC-RC-2026-022",
      coa_parameters: { acid_value: "208 mg KOH/g", melting_point: "69.5°C", iodine_value: "1.2", appearance: "White waxy flakes" },
      inspection_status: "passed", inspection_date: "2026-02-26", inspector_name: "QC-Dinesh K.",
      storage_location: "Pune Plant", bin: "RM-B03",
    }],
  },
  {
    grn_number: "GRN-2026-0310", purchase_order_number: "PO-2026-0192",
    vendor_id: "SUP-004", vendor_name: "Mold-Tek Containers", grn_date: "2026-03-01",
    line_items: [{
      material_code: "PM-1001", material_name: "HDPE Bottle 5L", material_type: "PM",
      quantity: 2000, unit: "pcs", rm_batch_number: "PM-B-1001-0120",
      supplier_lot_number: "MT-HDPE-2026-055", heat_number: "HN-91200",
      coa_reference: "CoC-MT-2026-055",
      coa_parameters: { wall_thickness: "2.1 mm", weight: "185 g", drop_test: "Pass (1.2m)", appearance: "Natural HDPE, UV stabilised" },
      inspection_status: "passed", inspection_date: "2026-03-02", inspector_name: "QC-Rekha M.",
      storage_location: "Pune Plant", bin: "PM-A01",
    }],
  },
  {
    grn_number: "GRN-2026-0322", purchase_order_number: "PO-2026-0201",
    vendor_id: "SUP-011", vendor_name: "Jayant Agro", grn_date: "2026-03-05",
    line_items: [{
      material_code: "RM-2087", material_name: "Stearic Acid", material_type: "RM",
      quantity: 500, unit: "kg", rm_batch_number: "RM-B-2087-0041",
      supplier_lot_number: "JA-SA-2026-018", heat_number: "HN-90112",
      coa_reference: "CoC-JA-2026-018",
      coa_parameters: { acid_value: "205 mg KOH/g", melting_point: "68.2°C", iodine_value: "1.8", appearance: "Off-white flakes" },
      inspection_status: "passed", inspection_date: "2026-03-06", inspector_name: "QC-Dinesh K.",
      storage_location: "Pune Plant", bin: "RM-B05",
    }],
  },
  {
    grn_number: "GRN-2026-0328", purchase_order_number: "PO-2026-0208",
    vendor_id: "SUP-008", vendor_name: "Givaudan India", grn_date: "2026-03-15",
    line_items: [{
      material_code: "RM-8012", material_name: "Fragrance Blend FG-04", material_type: "RM",
      quantity: 50, unit: "L", rm_batch_number: "RM-B-8012-0015",
      supplier_lot_number: "GI-FG04-2026-003", heat_number: "HN-92100",
      coa_reference: "CoC-GI-2026-003",
      coa_parameters: { flash_point: "62°C", specific_gravity: "0.92", allergen_compliance: "IFRA 51st Amendment", appearance: "Clear pale yellow liquid" },
      inspection_status: "passed", inspection_date: "2026-03-16", inspector_name: "QC-Rekha M.",
      storage_location: "Pune Plant", bin: "RM-D02",
    }],
  },
];

export const getGRN = (grnNumber: string) => grns.find(g => g.grn_number === grnNumber);
export const getGRNsByPO = (poNumber: string) => grns.filter(g => g.purchase_order_number === poNumber);
export const getGRNsByRMBatch = (rmBatch: string) => grns.filter(g => g.line_items.some(li => li.rm_batch_number === rmBatch));
