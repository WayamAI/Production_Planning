import type { ConstraintSeverity, ConstraintStatus, ConstraintType } from "@/lib/types";

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
