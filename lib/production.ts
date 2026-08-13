import { getOrders } from "@/lib/orders";
import { getBuildRecords, hashString, mulberry32, pick } from "@/lib/traceability";
import type { Constraint, ConstraintStatus, ConstraintType, ProductionOrder } from "@/lib/types";

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

const PLANT_STAFF = ["Priya S.", "Karthik R.", "Suresh P.", "Anita D.", "Ramesh T.", "Mohan K."];

const FLAVOR_CONSTRAINTS: Array<{
  type: ConstraintType;
  resource: string;
  impact: string;
  resolution: string;
}> = [
  {
    type: "machine_maintenance",
    resource: "Line 2 — Filling Machine",
    impact: "Scheduled downtime, 06:00–08:00",
    resolution: "Preventive maintenance window confirmed",
  },
  {
    type: "labour_shortage",
    resource: "Night shift — plant floor",
    impact: "Reduced throughput on affected line",
    resolution: "Cross-trained operators reassigned",
  },
  {
    type: "utility_outage",
    resource: "Boiler #2 — Steam supply",
    impact: "Mixing operations delayed",
    resolution: "Backup boiler commissioned",
  },
];

function orderConstraint(order: ProductionOrder, index: number): Constraint | null {
  const rand = mulberry32(hashString(`constraint-${order.id}`));

  if (order.status === "on_hold") {
    return {
      id: `C-${String(index).padStart(3, "0")}`,
      type: pick(["material_shortage", "quality_hold"] as ConstraintType[], rand),
      resource: order.name,
      impact: `${order.name} — production on hold`,
      severity: "high",
      date: order.scheduledDate,
      resolution: "Under review — awaiting resolution",
      status: "open",
      owner: pick(PLANT_STAFF, rand),
      orderId: order.id,
    };
  }

  if (order.status === "overdue") {
    return {
      id: `C-${String(index).padStart(3, "0")}`,
      type: "capacity_overload",
      resource: order.line,
      impact: `${order.name} — past due date`,
      severity: "medium",
      date: order.dueDate,
      resolution: `Reschedule or expedite on ${order.line}`,
      status: "open",
      owner: pick(PLANT_STAFF, rand),
      orderId: order.id,
    };
  }

  return null;
}

export function getConstraints(): Constraint[] {
  const constraints: Constraint[] = [];

  getOrders().forEach((order) => {
    const constraint = orderConstraint(order, constraints.length + 1);
    if (constraint) constraints.push(constraint);
  });

  FLAVOR_CONSTRAINTS.forEach((flavor, i) => {
    const rand = mulberry32(hashString(`flavor-constraint-${i}`));
    const statusPool: ConstraintStatus[] = ["mitigated", "scheduled", "resolved"];
    constraints.push({
      id: `C-${String(constraints.length + 1).padStart(3, "0")}`,
      type: flavor.type,
      resource: flavor.resource,
      impact: flavor.impact,
      severity: "low",
      date: new Date().toISOString().slice(0, 10),
      resolution: flavor.resolution,
      status: pick(statusPool, rand),
      owner: pick(PLANT_STAFF, rand),
    });
  });

  return constraints;
}
