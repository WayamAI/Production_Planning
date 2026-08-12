import { describe, expect, it } from "vitest";
import { buildAffectedSerialsCsv, buildContainmentPlanText, buildEightDReportText } from "@/lib/traceability-export";
import type { BuildRecord, FunnelResult, WarrantyClaim } from "@/lib/types";

const sampleBuild: BuildRecord = {
  serial: "SN-TEST-001",
  orderId: "order-1",
  assemblyDate: "2026-03-18",
  workCentre: "WC-01 Mixing",
  operator: "OP-023 Anita D.",
  lotsConsumed: ["LOT-2026-0189"],
  qcResult: "fail",
  processParams: [{ name: "Mix Temperature", value: 83, specMin: 65, specMax: 80, unit: "°C" }],
  designCheckPass: true,
  supplierCheckPass: false,
  supplierCheckNote: "Inspection failed",
  shipped: true,
  returned: true,
};

const sampleClaims: WarrantyClaim[] = [
  { id: "WC-1", serial: "SN-TEST-001", customer: "Reliance Retail", description: "Discoloration", status: "investigating" },
];

describe("buildEightDReportText", () => {
  it("includes the out-of-spec parameter and linked claims", () => {
    const text = buildEightDReportText(sampleBuild, sampleClaims);
    expect(text).toContain("SN-TEST-001");
    expect(text).toContain("Mix Temperature = 83°C (spec: 65-80°C)");
    expect(text).toContain("Reliance Retail");
  });

  it("reports no out-of-spec parameters when everything is within spec", () => {
    const cleanBuild: BuildRecord = {
      ...sampleBuild,
      processParams: [{ name: "Mix Temperature", value: 72, specMin: 65, specMax: 80, unit: "°C" }],
    };
    expect(buildEightDReportText(cleanBuild, [])).toContain("No process parameters out of spec");
  });
});

describe("buildAffectedSerialsCsv", () => {
  it("produces a header row plus one quoted row per build", () => {
    const csv = buildAffectedSerialsCsv([sampleBuild]);
    const rows = csv.split("\n");
    expect(rows[0]).toBe("serial,order_id,assembly_date,work_centre,qc_result,lots_consumed");
    expect(rows[1]).toContain('"SN-TEST-001"');
    expect(rows[1]).toContain('"LOT-2026-0189"');
  });
});

describe("buildContainmentPlanText", () => {
  it("labels the plan Critical when the at-risk ratio is high", () => {
    const funnel: FunnelResult = {
      totalProduced: 10,
      lotUsedInBuild: 8,
      assembledPassedQc: 6,
      shippedToField: 5,
      atRiskInField: 4,
      returnedDefective: 1,
      affectedSerials: [sampleBuild],
    };
    const text = buildContainmentPlanText(funnel);
    expect(text).toContain("Containment priority: Critical");
    expect(text).toContain("SN-TEST-001");
  });
});
