"use client";

import { useState } from "react";
import { ensureTraceabilitySeeded } from "@/lib/traceability";
import type { CriticalAlert } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertBanner } from "@/components/dashboard/traceability/alert-banner";
import { TraceSearch } from "@/components/dashboard/traceability/trace-search";
import { PopulationAtRisk } from "@/components/dashboard/traceability/population-at-risk";

// Same rationale as app/dashboard/page.tsx: this only ever renders on the
// client after DashboardLayout's auth-gated mount check, so seeding here is safe.
function loadAlerts(): CriticalAlert[] {
  return ensureTraceabilitySeeded();
}

export default function TraceabilityPage() {
  const [alerts] = useState(loadAlerts);
  const [activeTab, setActiveTab] = useState("search");
  const [activeQuery, setActiveQuery] = useState("");
  const [jumpId, setJumpId] = useState(0);

  function handleAlertSelect(query: string) {
    setActiveQuery(query);
    setJumpId((id) => id + 1);
    setActiveTab("search");
  }

  return (
    <div className="space-y-6">
      <AlertBanner alerts={alerts} onSelect={handleAlertSelect} />
      <h1 className="text-2xl font-semibold">BOM Traceability</h1>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as string)}>
        <TabsList>
          <TabsTrigger value="search">Trace Search</TabsTrigger>
          <TabsTrigger value="risk">Population at Risk</TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="mt-4">
          <TraceSearch key={`${activeQuery}-${jumpId}`} initialQuery={activeQuery} />
        </TabsContent>
        <TabsContent value="risk" className="mt-4">
          <PopulationAtRisk />
        </TabsContent>
      </Tabs>
    </div>
  );
}
