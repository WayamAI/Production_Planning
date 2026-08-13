"use client";

import { useMemo, useState } from "react";
import { ActiveConstraintsPanel } from "@/components/dashboard/production/active-constraints-panel";
import { WorkOrderRows } from "@/components/dashboard/production/work-order-rows";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_CLASSES } from "@/lib/order-status";
import type { ProductionLine, ProductionOrder } from "@/lib/types";

const LINES: ProductionLine[] = ["Line 1", "Line 2", "Line 3", "Line 4"];
const WINDOW_DAYS = 7;

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function dayOffset(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShort(date: Date): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

interface ScheduleGanttProps {
  orders: ProductionOrder[];
}

export function ScheduleGantt({ orders }: ScheduleGanttProps) {
  const [view, setView] = useState<"gantt" | "list">("gantt");

  const windowStart = useMemo(() => {
    const today = new Date(new Date().toDateString());
    if (orders.length === 0) return today;
    const earliest = orders.reduce(
      (min, o) => (toDate(o.scheduledDate) < min ? toDate(o.scheduledDate) : min),
      toDate(orders[0].scheduledDate)
    );
    return earliest < today ? earliest : today;
  }, [orders]);

  const days = useMemo(
    () =>
      Array.from({ length: WINDOW_DAYS }, (_, i) => {
        const d = new Date(windowStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [windowStart]
  );

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">No production orders yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Last updated just now</p>
        <div className="flex gap-2">
          <Button size="sm" variant={view === "gantt" ? undefined : "outline"} onClick={() => setView("gantt")}>
            Gantt
          </Button>
          <Button size="sm" variant={view === "list" ? undefined : "outline"} onClick={() => setView("list")}>
            List
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <WorkOrderRows
          orders={[...orders].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))}
        />
      ) : (
        <div className="grid grid-cols-[1fr_260px] gap-4">
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0" />
              <div className="grid flex-1 grid-cols-7 gap-1 text-xs text-muted-foreground">
                {days.map((d) => (
                  <span key={d.toISOString()}>{formatShort(d)}</span>
                ))}
              </div>
            </div>
            {LINES.map((line) => (
              <div key={line} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                  {line}
                </span>
                <div className="grid flex-1 grid-cols-7 gap-1">
                  {orders
                    .filter((o) => o.line === line)
                    .map((order) => {
                      const startOffset = Math.max(
                        0,
                        dayOffset(windowStart, toDate(order.scheduledDate))
                      );
                      const endOffset = Math.min(
                        WINDOW_DAYS - 1,
                        dayOffset(windowStart, toDate(order.dueDate))
                      );
                      if (endOffset < 0 || startOffset >= WINDOW_DAYS) return null;
                      const span = Math.max(1, endOffset - startOffset + 1);
                      return (
                        <div
                          key={order.id}
                          className={`truncate rounded px-2 py-1 text-xs ${ORDER_STATUS_CLASSES[order.status]}`}
                          style={{ gridColumn: `${startOffset + 1} / span ${span}` }}
                          title={order.name}
                        >
                          {order.name}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
          <ActiveConstraintsPanel />
        </div>
      )}
    </div>
  );
}
