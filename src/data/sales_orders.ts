// Sales Orders — linked to production batches

export interface SOLineItem {
  product_code: string;
  product_name: string;
  quantity: number;
  unit: string;
  batch_number: string; // FK to production_batches
  unit_price: number;
}

export interface SalesOrder {
  so_number: string;
  customer_id: string;
  customer_name: string;
  customer_type: "distributor" | "modern_trade" | "ecommerce" | "institutional";
  so_date: string;
  status: "Confirmed" | "Processing" | "Dispatched" | "Delivered" | "Cancelled";
  invoice_number: string;
  dispatch_date: string;
  delivery_status: "delivered" | "in_transit" | "pending";
  line_items: SOLineItem[];
}

export const salesOrders: SalesOrder[] = [
  {
    so_number: "SO-4521", customer_id: "CUST-001", customer_name: "Reliance Retail",
    customer_type: "modern_trade", so_date: "2026-03-19", status: "Delivered",
    invoice_number: "INV-2026-1845", dispatch_date: "2026-03-20", delivery_status: "delivered",
    line_items: [
      { product_code: "FG-IC-5L", product_name: "Industrial Cleaner 5L", quantity: 800, unit: "units", batch_number: "B-2026-0412", unit_price: 385 },
    ],
  },
  {
    so_number: "SO-4528", customer_id: "CUST-002", customer_name: "DMart",
    customer_type: "modern_trade", so_date: "2026-03-21", status: "Dispatched",
    invoice_number: "INV-2026-1852", dispatch_date: "2026-03-22", delivery_status: "in_transit",
    line_items: [
      { product_code: "FG-IC-5L", product_name: "Industrial Cleaner 5L", quantity: 500, unit: "units", batch_number: "B-2026-0412", unit_price: 385 },
    ],
  },
  {
    so_number: "SO-4530", customer_id: "CUST-003", customer_name: "BigBasket",
    customer_type: "ecommerce", so_date: "2026-03-11", status: "Delivered",
    invoice_number: "INV-2026-1860", dispatch_date: "2026-03-12", delivery_status: "delivered",
    line_items: [
      { product_code: "FG-DW-500", product_name: "Dish Wash 500ml", quantity: 600, unit: "units", batch_number: "B-2026-0395", unit_price: 85 },
    ],
  },
  {
    so_number: "SO-4532", customer_id: "CUST-004", customer_name: "Spencer's Retail",
    customer_type: "modern_trade", so_date: "2026-03-12", status: "Delivered",
    invoice_number: "INV-2026-1865", dispatch_date: "2026-03-13", delivery_status: "delivered",
    line_items: [
      { product_code: "FG-DW-500", product_name: "Dish Wash 500ml", quantity: 400, unit: "units", batch_number: "B-2026-0395", unit_price: 85 },
      { product_code: "FG-HW-250", product_name: "Hand Wash 250ml", quantity: 1200, unit: "units", batch_number: "B-2026-0401", unit_price: 62 },
    ],
  },
  {
    so_number: "SO-4535", customer_id: "CUST-005", customer_name: "Amazon India",
    customer_type: "ecommerce", so_date: "2026-03-16", status: "Delivered",
    invoice_number: "INV-2026-1870", dispatch_date: "2026-03-17", delivery_status: "delivered",
    line_items: [
      { product_code: "FG-FP-1L", product_name: "Floor Polish 1L", quantity: 1200, unit: "units", batch_number: "B-2026-0408", unit_price: 195 },
    ],
  },
  {
    so_number: "SO-4538", customer_id: "CUST-006", customer_name: "Flipkart",
    customer_type: "ecommerce", so_date: "2026-03-17", status: "Dispatched",
    invoice_number: "INV-2026-1878", dispatch_date: "2026-03-19", delivery_status: "in_transit",
    line_items: [
      { product_code: "FG-FP-1L", product_name: "Floor Polish 1L", quantity: 800, unit: "units", batch_number: "B-2026-0408", unit_price: 195 },
    ],
  },
  {
    so_number: "SO-4540", customer_id: "CUST-007", customer_name: "Tata Enterprise Solutions",
    customer_type: "institutional", so_date: "2026-03-18", status: "Delivered",
    invoice_number: "INV-2026-1882", dispatch_date: "2026-03-19", delivery_status: "delivered",
    line_items: [
      { product_code: "FG-FP-1L", product_name: "Floor Polish 1L", quantity: 1800, unit: "units", batch_number: "B-2026-0408", unit_price: 180 },
    ],
  },
  {
    so_number: "SO-4542", customer_id: "CUST-008", customer_name: "Metro Cash & Carry",
    customer_type: "modern_trade", so_date: "2026-03-14", status: "Delivered",
    invoice_number: "INV-2026-1888", dispatch_date: "2026-03-15", delivery_status: "delivered",
    line_items: [
      { product_code: "FG-HW-250", product_name: "Hand Wash 250ml", quantity: 3000, unit: "units", batch_number: "B-2026-0401", unit_price: 62 },
      { product_code: "FG-GC-1L", product_name: "Glass Cleaner 1L", quantity: 800, unit: "units", batch_number: "B-2026-0388", unit_price: 125 },
    ],
  },
  {
    so_number: "SO-4545", customer_id: "CUST-009", customer_name: "Hindustan Unilever (co-pack)",
    customer_type: "institutional", so_date: "2026-03-20", status: "Delivered",
    invoice_number: "INV-2026-1892", dispatch_date: "2026-03-21", delivery_status: "delivered",
    line_items: [
      { product_code: "FG-GC-1L", product_name: "Glass Cleaner 1L", quantity: 1400, unit: "units", batch_number: "B-2026-0388", unit_price: 115 },
    ],
  },
  {
    so_number: "SO-4548", customer_id: "CUST-010", customer_name: "ITC Hotels",
    customer_type: "institutional", so_date: "2026-03-06", status: "Delivered",
    invoice_number: "INV-2026-1898", dispatch_date: "2026-03-07", delivery_status: "delivered",
    line_items: [
      { product_code: "FG-TC-500", product_name: "Toilet Cleaner 500ml", quantity: 2400, unit: "units", batch_number: "B-2026-0380", unit_price: 72 },
      { product_code: "FG-SD-5L", product_name: "Surface Disinfectant 5L", quantity: 500, unit: "units", batch_number: "B-2026-0371", unit_price: 420 },
    ],
  },
  {
    so_number: "SO-4550", customer_id: "CUST-011", customer_name: "Taj Hotels",
    customer_type: "institutional", so_date: "2026-03-08", status: "Delivered",
    invoice_number: "INV-2026-1902", dispatch_date: "2026-03-09", delivery_status: "delivered",
    line_items: [
      { product_code: "FG-TC-500", product_name: "Toilet Cleaner 500ml", quantity: 2700, unit: "units", batch_number: "B-2026-0380", unit_price: 72 },
      { product_code: "FG-SD-5L", product_name: "Surface Disinfectant 5L", quantity: 450, unit: "units", batch_number: "B-2026-0371", unit_price: 420 },
    ],
  },
  {
    so_number: "SO-4552", customer_id: "CUST-002", customer_name: "DMart",
    customer_type: "modern_trade", so_date: "2026-03-13", status: "Delivered",
    invoice_number: "INV-2026-1908", dispatch_date: "2026-03-14", delivery_status: "delivered",
    line_items: [
      { product_code: "FG-DW-500", product_name: "Dish Wash 500ml", quantity: 800, unit: "units", batch_number: "B-2026-0395", unit_price: 85 },
      { product_code: "FG-HW-250", product_name: "Hand Wash 250ml", quantity: 3000, unit: "units", batch_number: "B-2026-0401", unit_price: 62 },
    ],
  },
  {
    so_number: "SO-4555", customer_id: "CUST-012", customer_name: "Lemon Tree Hotels",
    customer_type: "institutional", so_date: "2026-03-02", status: "Delivered",
    invoice_number: "INV-2026-1912", dispatch_date: "2026-03-03", delivery_status: "delivered",
    line_items: [
      { product_code: "FG-SD-5L", product_name: "Surface Disinfectant 5L", quantity: 300, unit: "units", batch_number: "B-2026-0371", unit_price: 420 },
      { product_code: "FG-BC-500", product_name: "Bathroom Cleaner 500ml", quantity: 380, unit: "units", batch_number: "B-2025-1245", unit_price: 95 },
    ],
  },
];

export const getSOsByBatch = (batchNumber: string) =>
  salesOrders.filter(so => so.line_items.some(li => li.batch_number === batchNumber));
