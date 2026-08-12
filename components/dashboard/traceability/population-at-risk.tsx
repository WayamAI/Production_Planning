"use client";

import { useMemo, useState } from "react";
import {
  getBuildRecords,
  getContainmentPriority,
  getLots,
  getPopulationAtRisk,
  getSuppliers,
} from "@/lib/traceability";
import { buildAffectedSerialsCsv, buildContainmentPlanText, downloadTextFile } from "@/lib/traceability-export";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "all";

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[140px_1fr_60px] items-center gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="h-3 rounded-full bg-muted">
        <div className="h-3 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-right font-medium">{value.toLocaleString()}</span>
    </div>
  );
}

export function PopulationAtRisk() {
  const [lotNumber, setLotNumber] = useState(ALL);
  const [supplierId, setSupplierId] = useState(ALL);
  const [workCentre, setWorkCentre] = useState(ALL);

  const lots = useMemo(() => getLots(), []);
  const suppliers = useMemo(() => getSuppliers(), []);
  const workCentres = useMemo(() => Array.from(new Set(getBuildRecords().map((b) => b.workCentre))), []);

  const funnel = useMemo(
    () =>
      getPopulationAtRisk({
        lotNumber: lotNumber === ALL ? undefined : lotNumber,
        supplierId: supplierId === ALL ? undefined : supplierId,
        workCentre: workCentre === ALL ? undefined : workCentre,
      }),
    [lotNumber, supplierId, workCentre]
  );

  const priority = getContainmentPriority(funnel);
  const atRiskRatio =
    funnel.shippedToField > 0 ? Math.round((funnel.atRiskInField / funnel.shippedToField) * 100) : 0;

  function handleExportSerials() {
    downloadTextFile("affected-serials.csv", buildAffectedSerialsCsv(funnel.affectedSerials), "text/csv");
  }

  function handleGeneratePlan() {
    downloadTextFile("containment-action-plan.txt", buildContainmentPlanText(funnel), "text/plain");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Lot Number</p>
          <Select value={lotNumber} onValueChange={(value) => setLotNumber(value ?? ALL)}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string | null) => (!v || v === ALL ? "All Lots" : v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Lots</SelectItem>
              {lots.map((lot) => (
                <SelectItem key={lot.lotNumber} value={lot.lotNumber}>
                  {lot.lotNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Supplier</p>
          <Select value={supplierId} onValueChange={(value) => setSupplierId(value ?? ALL)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string | null) =>
                  !v || v === ALL ? "All Suppliers" : (suppliers.find((s) => s.id === v)?.name ?? v)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Suppliers</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Assembly Line</p>
          <Select value={workCentre} onValueChange={(value) => setWorkCentre(value ?? ALL)}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string | null) => (!v || v === ALL ? "All Lines" : v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Lines</SelectItem>
              {workCentres.map((wc) => (
                <SelectItem key={wc} value={wc}>
                  {wc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Containment Funnel</p>
        <FunnelBar label="Total Produced" value={funnel.totalProduced} max={funnel.totalProduced} />
        <FunnelBar label="Lot Used in Build" value={funnel.lotUsedInBuild} max={funnel.totalProduced} />
        <FunnelBar label="Assembled & Passed QC" value={funnel.assembledPassedQc} max={funnel.totalProduced} />
        <FunnelBar label="Shipped to Field" value={funnel.shippedToField} max={funnel.totalProduced} />
        <FunnelBar label="At Risk in Field" value={funnel.atRiskInField} max={funnel.totalProduced} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase">Units at Risk in Field</p>
          <p className="text-2xl font-semibold">{funnel.atRiskInField}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase">Already Returned / Defective</p>
          <p className="text-2xl font-semibold">{funnel.returnedDefective}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase">Containment Priority</p>
          <p className="text-2xl font-semibold">{priority}</p>
          <p className="text-xs text-muted-foreground">{atRiskRatio}% at-risk ratio</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExportSerials} disabled={funnel.affectedSerials.length === 0}>
          Export Affected Serial List
        </Button>
        <Button onClick={handleGeneratePlan}>Generate Containment Action Plan</Button>
      </div>
    </div>
  );
}
