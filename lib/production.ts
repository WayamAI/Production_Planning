import { getOrders } from "@/lib/orders";
import { getBuildRecords, getLots, getSuppliers, hashString, mulberry32, pick } from "@/lib/traceability";
import type { Constraint, ConstraintStatus, ConstraintType, ProductionOrder, ScheduleUpdate, ScheduleUpdateType } from "@/lib/types";

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

export function formatRelativeTime(minutesAgo: number): string {
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  const hours = Math.round((minutesAgo / 60) * 2) / 2;
  return `${hours} hr ago`;
}

export function getScheduleUpdates(): ScheduleUpdate[] {
  const updates: ScheduleUpdate[] = [];

  getOrders().forEach((order) => {
    const rand = mulberry32(hashString(`update-${order.id}`));

    if (order.status === "in_progress" || order.status === "completed") {
      updates.push({
        id: `U-${order.id}-start`,
        type: "production_start",
        description: `${order.name} — ${order.line} started batch production`,
        minutesAgo: Math.round(30 + rand() * 200),
        actor: "System",
        orderId: order.id,
      });
    }

    if (order.status === "completed") {
      updates.push({
        id: `U-${order.id}-complete`,
        type: "completion",
        description: `${order.name} — ${order.producedQty} units completed, sent to QC`,
        minutesAgo: Math.round(5 + rand() * 60),
        actor: pick(PLANT_STAFF, rand),
        orderId: order.id,
      });
    } else if (order.producedQty > 0) {
      const pct = Math.round((order.producedQty / order.quantity) * 100);
      updates.push({
        id: `U-${order.id}-qty`,
        type: "quantity_update",
        description: `${order.name} — produced ${order.producedQty} of ${order.quantity} (${pct}%)`,
        minutesAgo: Math.round(10 + rand() * 90),
        actor: "System",
        orderId: order.id,
      });
    }

    if (order.status === "on_hold") {
      updates.push({
        id: `U-${order.id}-delay`,
        type: "delay_alert",
        description: `${order.name} delayed — on hold`,
        minutesAgo: Math.round(5 + rand() * 40),
        actor: "System",
        orderId: order.id,
      });
    }
  });

  getBuildRecords().forEach((build) => {
    const rand = mulberry32(hashString(`update-build-${build.serial}`));

    if (build.qcResult === "fail") {
      updates.push({
        id: `U-${build.serial}-delay`,
        type: "delay_alert",
        description: `${build.serial} — ${build.supplierCheckNote ?? "QC issue detected"}`,
        minutesAgo: Math.round(2 + rand() * 30),
        actor: "QC Lab",
        orderId: build.orderId,
      });
    } else {
      updates.push({
        id: `U-${build.serial}-qc`,
        type: "qc_passed",
        description: `Batch ${build.serial} — all quality parameters within specification`,
        minutesAgo: Math.round(15 + rand() * 120),
        actor: "QC Lab",
        orderId: build.orderId,
      });
    }
  });

  getLots()
    .slice(0, 3)
    .forEach((lot, i) => {
      const rand = mulberry32(hashString(`update-lot-${lot.lotNumber}`));
      const supplier = getSuppliers().find((s) => s.id === lot.supplierId);
      updates.push({
        id: `U-lot-${lot.lotNumber}`,
        type: "material_receipt",
        description: `${lot.lotNumber} — ${lot.materialName} received from ${supplier?.name ?? "supplier"}`,
        minutesAgo: Math.round(60 + i * 45 + rand() * 60),
        actor: "Warehouse",
      });
    });

  return updates.sort((a, b) => a.minutesAgo - b.minutesAgo);
}
