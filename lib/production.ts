import { getBuildRecords } from "@/lib/traceability";
import type { ProductionOrder } from "@/lib/types";

export interface TraceScore {
  percent: number;
  band: "green" | "amber" | "red";
}

export function getTraceScore(order: ProductionOrder): TraceScore | null {
  if (order.producedQty <= 0) return null;

  const builds = getBuildRecords().filter((b) => b.orderId === order.id);
  if (builds.length === 0) return null;

  const passing = builds.filter(
    (b) => b.designCheckPass && b.supplierCheckPass && b.qcResult !== "fail"
  ).length;
  const percent = Math.round((passing / builds.length) * 100);

  const band: TraceScore["band"] = percent >= 95 ? "green" : percent >= 70 ? "amber" : "red";

  return { percent, band };
}

export function formatWorkOrderId(order: ProductionOrder): string {
  return `WO-${order.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
