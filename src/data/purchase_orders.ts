// Purchase Orders — cross-referenced with GRNs and vendors

export interface POLineItem {
  material_code: string;
  material_name: string;
  ordered_qty: number;
  received_qty: number;
  unit: string;
  unit_price: number;
  grn_numbers: string[]; // FK to GRN records that fulfilled this line
}

export interface PurchaseOrder {
  po_number: string;
  vendor_id: string;
  vendor_name: string;
  po_date: string;
  delivery_date: string;
  status: "Draft" | "Approved" | "Ordered" | "Partially Received" | "Fully Received" | "Cancelled";
  line_items: POLineItem[];
}

export const purchaseOrders: PurchaseOrder[] = [
  {
    po_number: "PO-2026-0198", vendor_id: "SUP-001", vendor_name: "Galaxy Surfactants",
    po_date: "2026-02-05", delivery_date: "2026-02-15", status: "Fully Received",
    line_items: [
      { material_code: "RM-4023", material_name: "Sodium Lauryl Sulphate", ordered_qty: 1200, received_qty: 1200, unit: "kg", unit_price: 185, grn_numbers: ["GRN-2026-0312", "GRN-2026-0318"] },
    ],
  },
  {
    po_number: "PO-2026-0195", vendor_id: "SUP-002", vendor_name: "Aarti Industries",
    po_date: "2026-02-08", delivery_date: "2026-02-20", status: "Fully Received",
    line_items: [
      { material_code: "RM-5018", material_name: "EDTA Disodium Salt", ordered_qty: 100, received_qty: 96, unit: "kg", unit_price: 420, grn_numbers: ["GRN-2026-0298"] },
    ],
  },
  {
    po_number: "PO-2026-0192", vendor_id: "SUP-004", vendor_name: "Mold-Tek Containers",
    po_date: "2026-02-10", delivery_date: "2026-02-25", status: "Fully Received",
    line_items: [
      { material_code: "PM-1001", material_name: "HDPE Bottle 5L", ordered_qty: 2000, received_qty: 2000, unit: "pcs", unit_price: 42, grn_numbers: ["GRN-2026-0310"] },
    ],
  },
  {
    po_number: "PO-2026-0189", vendor_id: "SUP-003", vendor_name: "Rashtriya Chemicals",
    po_date: "2026-02-12", delivery_date: "2026-02-28", status: "Fully Received",
    line_items: [
      { material_code: "RM-2087", material_name: "Stearic Acid", ordered_qty: 400, received_qty: 400, unit: "kg", unit_price: 145, grn_numbers: ["GRN-2026-0308"] },
    ],
  },
  {
    po_number: "PO-2026-0201", vendor_id: "SUP-011", vendor_name: "Jayant Agro",
    po_date: "2026-02-28", delivery_date: "2026-03-08", status: "Fully Received",
    line_items: [
      { material_code: "RM-2087", material_name: "Stearic Acid", ordered_qty: 500, received_qty: 500, unit: "kg", unit_price: 128, grn_numbers: ["GRN-2026-0322"] },
    ],
  },
  {
    po_number: "PO-2026-0185", vendor_id: "SUP-005", vendor_name: "Aqua Pure Systems",
    po_date: "2026-02-01", delivery_date: "2026-02-10", status: "Fully Received",
    line_items: [
      { material_code: "RM-7044", material_name: "Demineralised Water", ordered_qty: 5000, received_qty: 5000, unit: "L", unit_price: 2, grn_numbers: ["GRN-2026-0305"] },
    ],
  },
  {
    po_number: "PO-2026-0208", vendor_id: "SUP-008", vendor_name: "Givaudan India",
    po_date: "2026-03-01", delivery_date: "2026-03-15", status: "Fully Received",
    line_items: [
      { material_code: "RM-8012", material_name: "Fragrance Blend FG-04", ordered_qty: 50, received_qty: 50, unit: "L", unit_price: 2800, grn_numbers: ["GRN-2026-0328"] },
    ],
  },
];

export const getPO = (poNumber: string) => purchaseOrders.find(p => p.po_number === poNumber);
