import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types";

const LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  done: "Done",
};

const CLASSES: Record<OrderStatus, string> = {
  pending: "bg-primary-100 text-primary-800 hover:bg-primary-100",
  in_progress: "bg-primary-300 text-primary-900 hover:bg-primary-300",
  done: "bg-primary-600 text-white hover:bg-primary-600",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={CLASSES[status]}>{LABELS[status]}</Badge>;
}
