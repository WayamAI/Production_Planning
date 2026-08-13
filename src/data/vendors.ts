// Vendor / Supplier master data with quality scorecards and approved materials
// IDs match traceability.ts supplier IDs

export interface VendorScorecard {
  defect_rate_percent: number;
  copq_amount: string;
  on_time_delivery_percent: number;
  last_audit_date: string;
  audit_result: "Pass" | "Conditional" | "Fail";
}

export interface SCARRecord {
  scar_id: string;
  date: string;
  description: string;
  status: "Open" | "In Progress" | "Closed";
  lot_number: string;
}

export interface Vendor {
  vendor_id: string;
  vendor_name: string;
  vendor_code: string;
  location: string;
  contact_person: string;
  contact_email: string;
  payment_terms: string;
  asl: boolean;
  approved_materials: string[];
  quality_scorecard: VendorScorecard;
  scar_history: SCARRecord[];
}

export const vendors: Vendor[] = [
  {
    vendor_id: "SUP-001", vendor_name: "Galaxy Surfactants", vendor_code: "VEN-GS-001",
    location: "Navi Mumbai, Maharashtra", contact_person: "Rajesh Mehta", contact_email: "rajesh.m@galaxysurf.com",
    payment_terms: "Net 30", asl: true,
    approved_materials: ["RM-4023", "RM-4024"],
    quality_scorecard: { defect_rate_percent: 2.1, copq_amount: "₹4.2L", on_time_delivery_percent: 88, last_audit_date: "2025-11-15", audit_result: "Conditional" },
    scar_history: [
      { scar_id: "SCAR-2026-008", date: "2026-03-22", description: "Material grade mismatch — Industrial grade supplied instead of Cosmetic grade for SLS lot GS-SLS-2026-044", status: "Open", lot_number: "LOT-2026-0189" },
      { scar_id: "SCAR-2025-041", date: "2025-09-10", description: "Moisture content above spec (4.2% vs 3% max)", status: "Closed", lot_number: "LOT-2025-0892" },
    ],
  },
  {
    vendor_id: "SUP-002", vendor_name: "Aarti Industries", vendor_code: "VEN-AI-002",
    location: "Vapi, Gujarat", contact_person: "Priya Desai", contact_email: "priya.d@aartiind.com",
    payment_terms: "Net 45", asl: true,
    approved_materials: ["RM-5018", "RM-5019"],
    quality_scorecard: { defect_rate_percent: 1.8, copq_amount: "₹1.1L", on_time_delivery_percent: 85, last_audit_date: "2025-12-20", audit_result: "Pass" },
    scar_history: [],
  },
  {
    vendor_id: "SUP-003", vendor_name: "Rashtriya Chemicals", vendor_code: "VEN-RC-003",
    location: "Thane, Maharashtra", contact_person: "Amit Patil", contact_email: "amit.p@rcf.com",
    payment_terms: "Net 30", asl: true,
    approved_materials: ["RM-2087", "RM-9055"],
    quality_scorecard: { defect_rate_percent: 3.5, copq_amount: "₹2.8L", on_time_delivery_percent: 78, last_audit_date: "2025-10-05", audit_result: "Conditional" },
    scar_history: [
      { scar_id: "SCAR-2025-035", date: "2025-08-12", description: "Inconsistent melting point across lot — 3 sub-lots out of spec", status: "Closed", lot_number: "LOT-2025-0745" },
    ],
  },
  {
    vendor_id: "SUP-004", vendor_name: "Mold-Tek Containers", vendor_code: "VEN-MT-004",
    location: "Hyderabad, Telangana", contact_person: "Venkat Rao", contact_email: "venkat.r@moldtek.com",
    payment_terms: "Net 30", asl: true,
    approved_materials: ["PM-1001", "PM-1002", "PM-2003"],
    quality_scorecard: { defect_rate_percent: 0.5, copq_amount: "₹0.6L", on_time_delivery_percent: 94, last_audit_date: "2026-01-10", audit_result: "Pass" },
    scar_history: [],
  },
  {
    vendor_id: "SUP-005", vendor_name: "Aqua Pure Systems", vendor_code: "VEN-AP-005",
    location: "Pune, Maharashtra", contact_person: "Nitin Joshi", contact_email: "nitin.j@aquapure.in",
    payment_terms: "Net 15", asl: true,
    approved_materials: ["RM-7044"],
    quality_scorecard: { defect_rate_percent: 0.1, copq_amount: "₹0.05L", on_time_delivery_percent: 98, last_audit_date: "2026-02-01", audit_result: "Pass" },
    scar_history: [],
  },
  {
    vendor_id: "SUP-007", vendor_name: "Deepak Nitrite", vendor_code: "VEN-DN-007",
    location: "Vadodara, Gujarat", contact_person: "Sanjay Patel", contact_email: "sanjay.p@deepaknitrite.com",
    payment_terms: "Net 45", asl: true,
    approved_materials: ["RM-3310", "RM-1177"],
    quality_scorecard: { defect_rate_percent: 1.5, copq_amount: "₹1.3L", on_time_delivery_percent: 86, last_audit_date: "2025-11-28", audit_result: "Pass" },
    scar_history: [],
  },
  {
    vendor_id: "SUP-008", vendor_name: "Givaudan India", vendor_code: "VEN-GI-008",
    location: "Daman, UT", contact_person: "Meera Shah", contact_email: "meera.s@givaudan.com",
    payment_terms: "Net 60", asl: true,
    approved_materials: ["RM-8012"],
    quality_scorecard: { defect_rate_percent: 0.3, copq_amount: "₹0.3L", on_time_delivery_percent: 75, last_audit_date: "2026-01-22", audit_result: "Pass" },
    scar_history: [],
  },
  {
    vendor_id: "SUP-011", vendor_name: "Jayant Agro", vendor_code: "VEN-JA-011",
    location: "Ankleshwar, Gujarat", contact_person: "Kiran Jain", contact_email: "kiran.j@jayantagro.com",
    payment_terms: "Net 30", asl: false,
    approved_materials: [],
    quality_scorecard: { defect_rate_percent: 4.8, copq_amount: "₹0.9L", on_time_delivery_percent: 72, last_audit_date: "2025-06-15", audit_result: "Fail" },
    scar_history: [
      { scar_id: "SCAR-2025-022", date: "2025-06-20", description: "Unapproved substitution of raw material grade", status: "Closed", lot_number: "LOT-2025-0512" },
    ],
  },
];

export const getVendor = (vendorId: string) => vendors.find(v => v.vendor_id === vendorId);
