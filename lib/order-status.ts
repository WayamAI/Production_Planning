import type { OrderStatus } from "@/lib/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  done: "Done",
};

export const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-primary-100 text-primary-800 hover:bg-primary-100",
  in_progress: "bg-primary-300 text-primary-900 hover:bg-primary-300",
  done: "bg-primary-600 text-white hover:bg-primary-600",
};
