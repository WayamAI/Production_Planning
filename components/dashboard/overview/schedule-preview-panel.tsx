import type { OrderStatus, ProductionOrder } from "@/lib/types";

const READY_DOT_CLASSES: Record<OrderStatus, string> = {
  draft: "bg-muted-foreground",
  released: "bg-amber-500",
  in_progress: "bg-primary-500",
  completed: "bg-primary-500",
  on_hold: "bg-amber-500",
  overdue: "bg-destructive",
};

function isWithinNextDays(dateIso: string, days: number): boolean {
  const today = new Date(new Date().toDateString());
  const target = new Date(`${dateIso}T00:00:00`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

export function SchedulePreviewPanel({ orders }: { orders: ProductionOrder[] }) {
  const upcoming = orders
    .filter((o) => isWithinNextDays(o.scheduledDate, 7))
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Production Schedule (Next 7 Days)</p>
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders scheduled in the next 7 days.</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between border-t pt-2 text-sm first:border-t-0 first:pt-0"
            >
              <div>
                <p className="font-medium">{order.name}</p>
                <p className="text-xs text-muted-foreground">
                  {order.quantity.toLocaleString()} units · {order.scheduledDate}
                </p>
              </div>
              <span className={`h-2 w-2 rounded-full ${READY_DOT_CLASSES[order.status]}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
