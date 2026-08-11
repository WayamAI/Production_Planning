import type { ProductionOrder } from "@/lib/types";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";

interface OrderTimelineProps {
  orders: ProductionOrder[];
}

function groupByDate(orders: ProductionOrder[]): Map<string, ProductionOrder[]> {
  const groups = new Map<string, ProductionOrder[]>();
  for (const order of orders) {
    const existing = groups.get(order.scheduledDate) ?? [];
    existing.push(order);
    groups.set(order.scheduledDate, existing);
  }
  return groups;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function OrderTimeline({ orders }: OrderTimelineProps) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">No production orders yet.</p>;
  }

  const groups = groupByDate(orders);
  const dates = Array.from(groups.keys()).sort();

  return (
    <ol className="space-y-6">
      {dates.map((date) => (
        <li key={date} className="border-l-4 border-primary pl-4">
          <p className="font-semibold">{formatDate(date)}</p>
          <ul className="mt-2 space-y-2">
            {groups.get(date)!.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-4 text-sm">
                <span>
                  {order.name} &middot; {order.quantity} units
                </span>
                <OrderStatusBadge status={order.status} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
