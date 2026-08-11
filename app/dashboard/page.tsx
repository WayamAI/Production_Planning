"use client";

import { useState } from "react";
import { getOrders, seedOrdersIfEmpty } from "@/lib/orders";
import type { ProductionOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderTable } from "@/components/dashboard/order-table";
import { OrderTimeline } from "@/components/dashboard/order-timeline";
import { OrderFormDialog } from "@/components/dashboard/order-form-dialog";

// This page only ever renders on the client, after DashboardLayout's
// auth-gated mount check — so reading/seeding localStorage in the lazy
// initializer below is safe and never runs during SSR/hydration.
function loadOrders(): ProductionOrder[] {
  seedOrdersIfEmpty();
  return getOrders();
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>(loadOrders);

  function refresh() {
    setOrders(getOrders());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Production Orders</h1>
        <OrderFormDialog onSaved={refresh} trigger={<Button>New order</Button>} />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <OrderTable orders={orders} onChange={refresh} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <OrderTimeline orders={orders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
