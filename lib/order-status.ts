import type { OrderStatus } from "@/lib/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  released: "Released",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
  overdue: "Overdue",
};

export const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  draft: "bg-muted text-muted-foreground hover:bg-muted",
  released: "bg-primary-100 text-primary-800 hover:bg-primary-100",
  in_progress: "bg-primary-300 text-primary-900 hover:bg-primary-300",
  completed: "bg-primary-600 text-white hover:bg-primary-600",
  on_hold: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  overdue: "bg-destructive/15 text-destructive hover:bg-destructive/15",
};
