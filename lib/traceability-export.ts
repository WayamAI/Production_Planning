import type { BuildRecord, FunnelResult, WarrantyClaim } from "@/lib/types";
import { getContainmentPriority } from "@/lib/traceability";

export function buildEightDReportText(build: BuildRecord, claims: WarrantyClaim[]): string {
  const outOfSpec = build.processParams.filter((p) => p.value < p.specMin || p.value > p.specMax);

  const lines = [
    "8D REPORT — BOM TRACEABILITY",
    "=============================",
    `Serial: ${build.serial}`,
    `Assembly date: ${build.assemblyDate}`,
    `Work centre: ${build.workCentre}`,
    `Operator: ${build.operator}`,
    `Lots consumed: ${build.lotsConsumed.join(", ")}`,
    `QC result: ${build.qcResult.toUpperCase()}`,
    "",
    "D4 — Root Cause",
    ...(outOfSpec.length > 0
      ? outOfSpec.map((p) => `- ${p.name} = ${p.value}${p.unit} (spec: ${p.specMin}-${p.specMax}${p.unit})`)
      : ["- No process parameters out of spec"]),
    ...(build.supplierCheckNote ? [`- ${build.supplierCheckNote}`] : []),
    "",
    "D5 — Checks",
    `- Design check: ${build.designCheckPass ? "PASS" : "FAIL"}`,
    `- Supplier check: ${build.supplierCheckPass ? "PASS" : "FAIL"}`,
    "",
    `D8 — Linked warranty claims (${claims.length})`,
    ...(claims.length > 0
      ? claims.map((c) => `- ${c.id} · ${c.customer}: ${c.description} [${c.status.toUpperCase()}]`)
      : ["- None"]),
  ];

  return lines.join("\n");
}

export function buildAffectedSerialsCsv(builds: BuildRecord[]): string {
  const header = "serial,order_id,assembly_date,work_centre,qc_result,lots_consumed";
  const rows = builds.map((b) =>
    [b.serial, b.orderId, b.assemblyDate, b.workCentre, b.qcResult, b.lotsConsumed.join(" ")]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...rows].join("\n");
}

export function buildContainmentPlanText(funnel: FunnelResult): string {
  const priority = getContainmentPriority(funnel);

  const lines = [
    "CONTAINMENT ACTION PLAN",
    "========================",
    `Total produced: ${funnel.totalProduced}`,
    `Lot used in build: ${funnel.lotUsedInBuild}`,
    `Assembled & passed QC: ${funnel.assembledPassedQc}`,
    `Shipped to field: ${funnel.shippedToField}`,
    `At risk in field: ${funnel.atRiskInField}`,
    `Already returned/defective: ${funnel.returnedDefective}`,
    `Containment priority: ${priority}`,
    "",
    "Recommended steps:",
    "1. Quarantine remaining on-hand stock from the affected lot(s).",
    "2. Notify distribution partners holding the affected serial range.",
    "3. Issue a field containment notice for at-risk serials.",
    "4. Open a supplier corrective action request for the flagged lot.",
    "",
    `Affected serials (${funnel.affectedSerials.length}):`,
    ...(funnel.affectedSerials.length > 0 ? funnel.affectedSerials.map((b) => `- ${b.serial}`) : ["- None"]),
  ];

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
