export type OrderStatus =
  | "draft"
  | "released"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "overdue";

export type ProductionLine = "Line 1" | "Line 2" | "Line 3" | "Line 4";

export interface ProductionOrder {
  id: string;
  name: string;
  quantity: number;
  producedQty: number;
  scheduledDate: string; // ISO date, e.g. "2026-08-20"
  dueDate: string; // ISO date
  line: ProductionLine;
  bomVersion: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  name: string;
  quantity: number;
  producedQty: number;
  scheduledDate: string;
  dueDate: string;
  line: ProductionLine;
  bomVersion: string;
  status: OrderStatus;
}

export type UpdateOrderInput = Partial<CreateOrderInput>;

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

export type ConstraintType =
  | "material_shortage"
  | "machine_maintenance"
  | "capacity_overload"
  | "labour_shortage"
  | "quality_hold"
  | "utility_outage";

export type ConstraintSeverity = "high" | "medium" | "low";
export type ConstraintStatus = "open" | "mitigated" | "scheduled" | "resolved";

export interface Constraint {
  id: string;
  type: ConstraintType;
  resource: string;
  impact: string;
  severity: ConstraintSeverity;
  date: string; // ISO date
  resolution: string;
  status: ConstraintStatus;
  owner: string;
  orderId?: string;
}

export type ScheduleUpdateType =
  | "production_start"
  | "completion"
  | "quantity_update"
  | "delay_alert"
  | "qc_passed"
  | "material_receipt";

export interface ScheduleUpdate {
  id: string;
  type: ScheduleUpdateType;
  description: string;
  minutesAgo: number;
  actor: string;
  orderId?: string;
}

export interface OverviewMetric {
  label: string;
  value: string;
  trend?: string;
  tone: "critical" | "warning" | "good";
}

export interface StockExhaustionAlert {
  id: string;
  material: string;
  quantity: string;
  daysOfCoverage: number;
  action: "Raise PO" | "Review" | "Monitor";
}

export interface MissingScanException {
  id: string;
  workOrderCode: string;
  part: string;
  station: string;
  shift: "Shift A" | "Shift B" | "Shift C";
  date: string;
  resolved: boolean;
}

export interface MrpRunStatus {
  lastRun: string;
  durationSeconds: number;
  plannedOrders: number;
  exceptions: number;
}
