"use client";

import { getWarrantyClaims } from "@/lib/traceability";
import { buildEightDReportText, downloadTextFile } from "@/lib/traceability-export";
import { QcResultBadge } from "@/components/dashboard/qc-result-badge";
import { Button } from "@/components/ui/button";
import type { BuildRecord } from "@/lib/types";

interface BuildRecordCardProps {
  build: BuildRecord;
  onSelectLot?: (lotNumber: string) => void;
}

export function BuildRecordCard({ build, onSelectLot }: BuildRecordCardProps) {
  const claims = getWarrantyClaims().filter((c) => c.serial === build.serial);
  const outOfSpec = build.processParams.filter((p) => p.value < p.specMin || p.value > p.specMax);

  function handleExport() {
    const text = buildEightDReportText(build, claims);
    downloadTextFile(`8D-report-${build.serial}.txt`, text, "text/plain");
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          MBOM — Manufacturing Build Record
        </p>
        <QcResultBadge result={build.qcResult} />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Serial</p>
          <p>{build.serial}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Assembly Date</p>
          <p>{build.assemblyDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Work Centre</p>
          <p>{build.workCentre}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Operator</p>
          <p>{build.operator}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Lots Consumed</p>
          <p className="flex flex-wrap gap-1">
            {build.lotsConsumed.map((lotNumber, i) => (
              <span key={lotNumber}>
                {onSelectLot ? (
                  <button
                    type="button"
                    className="underline underline-offset-2 hover:no-underline"
                    onClick={() => onSelectLot(lotNumber)}
                  >
                    {lotNumber}
                  </button>
                ) : (
                  lotNumber
                )}
                {i < build.lotsConsumed.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      </div>

      {outOfSpec.length > 0 && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          ⚠ Process parameter(s) out of spec:{" "}
          {outOfSpec
            .map((p) => `${p.name} = ${p.value}${p.unit} (spec: ${p.specMin}-${p.specMax}${p.unit})`)
            .join("; ")}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border px-3 py-2 text-sm">
          <span className={build.designCheckPass ? "text-primary-600 dark:text-primary-400" : "text-destructive"}>
            {build.designCheckPass ? "✓" : "✗"}
          </span>{" "}
          <span className="font-medium">Design Check</span>
          <p className="text-muted-foreground">
            {build.designCheckPass ? "Correct revision active on build date" : "Revision mismatch at assembly"}
          </p>
        </div>
        <div className="rounded-md border px-3 py-2 text-sm">
          <span className={outOfSpec.length === 0 ? "text-primary-600 dark:text-primary-400" : "text-destructive"}>
            {outOfSpec.length === 0 ? "✓" : "✗"}
          </span>{" "}
          <span className="font-medium">Process Check</span>
          <p className="text-muted-foreground">
            {outOfSpec.length === 0
              ? "All process parameters within spec"
              : `${outOfSpec.length} parameter(s) out of spec at assembly`}
          </p>
        </div>
        <div className="rounded-md border px-3 py-2 text-sm">
          <span className={build.supplierCheckPass ? "text-primary-600 dark:text-primary-400" : "text-destructive"}>
            {build.supplierCheckPass ? "✓" : "✗"}
          </span>{" "}
          <span className="font-medium">Supplier Check</span>
          <p className="text-muted-foreground">
            {build.supplierCheckPass
              ? "Approved supplier, passed inspection, correct material"
              : (build.supplierCheckNote ?? "Issues: failed inspection")}
          </p>
        </div>
      </div>

      {claims.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Linked Warranty Claims ({claims.length})</p>
          {claims.map((claim) => (
            <div key={claim.id} className="flex items-center justify-between border-t pt-2 text-sm">
              <span>
                <span className="font-mono text-xs text-muted-foreground">{claim.id}</span>{" "}
                <span className="font-medium">{claim.customer}</span> — {claim.description}
              </span>
              <span className="text-xs font-medium text-amber-700 uppercase dark:text-amber-400">
                {claim.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={handleExport}>
        Export 8D Report
      </Button>
    </div>
  );
}
