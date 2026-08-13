"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrders } from "@/lib/orders";
import { ensureTraceabilitySeeded } from "@/lib/traceability";
import { getLiveMetrics, getMockMetrics } from "@/lib/overview";
import type { ProductionOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/overview/metric-card";
import { MrpRunPanel } from "@/components/dashboard/overview/mrp-run-panel";
import { StockExhaustionPanel } from "@/components/dashboard/overview/stock-exhaustion-panel";
import { SchedulePreviewPanel } from "@/components/dashboard/overview/schedule-preview-panel";
import { MissingScanTable } from "@/components/dashboard/overview/missing-scan-table";
import { CoverageChart } from "@/components/dashboard/overview/coverage-chart";
import { TraceLineChart } from "@/components/dashboard/overview/trace-line-chart";

// Same rationale as the other dashboard pages: this only ever renders on the
// client after DashboardLayout's auth-gated mount check, so seeding here is
// safe. ensureTraceabilitySeeded() also seeds orders, which every live metric
// on this page depends on existing.
function loadOrders(): ProductionOrder[] {
  ensureTraceabilitySeeded();
  return getOrders();
}

export default function OverviewPage() {
  const router = useRouter();
  const [orders] = useState<ProductionOrder[]>(loadOrders);
  const metrics = [...getLiveMetrics(), ...getMockMetrics()];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Planning Overview</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CoverageChart />
        <TraceLineChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MrpRunPanel />
        <StockExhaustionPanel />
        <SchedulePreviewPanel orders={orders} />
      </div>

      <MissingScanTable />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled>
          Run MRP
        </Button>
        <Button variant="outline" disabled>
          Review Purchase Plan
        </Button>
        <Button variant="outline" onClick={() => router.push("/dashboard/traceability")}>
          BOM Traceability
        </Button>
        <Button variant="outline" disabled>
          Check Slow-Moving Stock
        </Button>
      </div>
    </div>
  );
}
