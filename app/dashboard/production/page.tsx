"use client";

import { useState } from "react";
import { getOrders } from "@/lib/orders";
import { ensureTraceabilitySeeded } from "@/lib/traceability";
import type { ProductionOrder } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleGantt } from "@/components/dashboard/production/schedule-gantt";
import { WorkOrderTable } from "@/components/dashboard/production/work-order-table";
import { ConstraintsTable } from "@/components/dashboard/production/constraints-table";
import { ScheduleUpdatesFeed } from "@/components/dashboard/production/schedule-updates-feed";

// Same rationale as app/dashboard/page.tsx and app/dashboard/traceability/page.tsx:
// this only ever renders on the client after DashboardLayout's auth-gated mount
// check, so seeding here is safe. ensureTraceabilitySeeded() also seeds orders,
// which Trace %/Constraints/Schedule Updates all depend on existing.
function loadOrders(): ProductionOrder[] {
  ensureTraceabilitySeeded();
  return getOrders();
}

export default function ProductionPage() {
  const [orders] = useState<ProductionOrder[]>(loadOrders);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Production</h1>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-4">
          <ScheduleGantt orders={orders} />
        </TabsContent>
        <TabsContent value="work-orders" className="mt-4">
          <WorkOrderTable orders={orders} />
        </TabsContent>
        <TabsContent value="constraints" className="mt-4">
          <ConstraintsTable />
        </TabsContent>
        <TabsContent value="updates" className="mt-4">
          <ScheduleUpdatesFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
}
