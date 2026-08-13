"use client";

import { useMemo, useState } from "react";
import { WorkOrderRows } from "@/components/dashboard/production/work-order-rows";
import { cn } from "@/lib/utils";
import type { OrderStatus, ProductionOrder } from "@/lib/types";

const STATUS_TABS: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "released", label: "Released" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "overdue", label: "Overdue" },
];

interface WorkOrderTableProps {
  orders: ProductionOrder[];
}

export function WorkOrderTable({ orders }: WorkOrderTableProps) {
  const [activeStatus, setActiveStatus] = useState<OrderStatus | "all">("all");

  const counts = useMemo(() => {
    const base: Record<OrderStatus | "all", number> = {
      all: orders.length,
      draft: 0,
      released: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0,
      overdue: 0,
    };
    for (const order of orders) {
      base[order.status] += 1;
    }
    return base;
  }, [orders]);

  const filtered = activeStatus === "all" ? orders : orders.filter((o) => o.status === activeStatus);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveStatus(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeStatus === tab.value
                ? "bg-primary-100 text-primary-800"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label} ({counts[tab.value]})
          </button>
        ))}
      </div>
      <WorkOrderRows orders={filtered} />
    </div>
  );
}
