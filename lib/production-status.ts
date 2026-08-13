import type { ConstraintSeverity, ConstraintStatus, ConstraintType, ScheduleUpdateType } from "@/lib/types";

export const CONSTRAINT_TYPE_LABELS: Record<ConstraintType, string> = {
  material_shortage: "Material Shortage",
  machine_maintenance: "Machine Maintenance",
  capacity_overload: "Capacity Overload",
  labour_shortage: "Labour Shortage",
  quality_hold: "Quality Hold",
  utility_outage: "Utility Outage",
};

export const CONSTRAINT_SEVERITY_CLASSES: Record<ConstraintSeverity, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-muted text-muted-foreground",
};

export const CONSTRAINT_STATUS_CLASSES: Record<ConstraintStatus, string> = {
  open: "bg-destructive/15 text-destructive",
  mitigated: "bg-amber-100 text-amber-800",
  scheduled: "bg-primary-100 text-primary-800",
  resolved: "bg-primary-600 text-white",
};

export const SCHEDULE_UPDATE_TYPE_LABELS: Record<ScheduleUpdateType, string> = {
  production_start: "Production Start",
  completion: "Completion",
  quantity_update: "Quantity Update",
  delay_alert: "Delay Alert",
  qc_passed: "QC Passed",
  material_receipt: "Material Receipt",
};

export const SCHEDULE_UPDATE_TYPE_CLASSES: Record<ScheduleUpdateType, string> = {
  production_start: "bg-primary-100 text-primary-800",
  completion: "bg-primary-600 text-white",
  quantity_update: "bg-muted text-muted-foreground",
  delay_alert: "bg-destructive/15 text-destructive",
  qc_passed: "bg-primary-600 text-white",
  material_receipt: "bg-primary-100 text-primary-800",
};
