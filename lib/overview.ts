import { getOrders } from "@/lib/orders";
import { getTraceScore } from "@/lib/production";
import { getCriticalAlerts, getPopulationAtRisk, getBuildRecords } from "@/lib/traceability";
import type { OverviewMetric, StockExhaustionAlert, MissingScanException, MrpRunStatus } from "@/lib/types";

function toneFor(value: number, goodAt: number, warningAt: number): OverviewMetric["tone"] {
  if (value >= goodAt) return "good";
  if (value >= warningAt) return "warning";
  return "critical";
}

export function getLiveMetrics(): OverviewMetric[] {
  const orders = getOrders();

  const pending = orders.filter((o) => o.status !== "completed");
  const pendingRisky = pending.some((o) => o.status === "on_hold" || o.status === "overdue");

  const scores = orders
    .map((o) => getTraceScore(o))
    .filter((s): s is NonNullable<ReturnType<typeof getTraceScore>> => s !== null);
  const traceCompleteness =
    scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.percent, 0) / scores.length) : 0;

  const alerts = getCriticalAlerts();

  const funnel = getPopulationAtRisk({});
  const recallAccuracy =
    funnel.shippedToField > 0
      ? Math.max(0, Math.min(100, Math.round(100 - (funnel.atRiskInField / funnel.shippedToField) * 100)))
      : 100;

  const completedOrders = orders.filter((o) => o.status === "completed");
  const onTimeCompleted = completedOrders.filter((o) => o.scheduledDate <= o.dueDate);
  const scheduleAdherence =
    completedOrders.length > 0 ? Math.round((onTimeCompleted.length / completedOrders.length) * 100) : 100;

  return [
    {
      label: "Pending Work Orders",
      value: `${pending.length}`,
      trend: pendingRisky ? "Needs attention" : "On track",
      tone: pendingRisky ? "warning" : "good",
    },
    {
      label: "Trace Completeness",
      value: `${traceCompleteness}%`,
      tone: toneFor(traceCompleteness, 90, 70),
    },
    {
      label: "Active Suspect Lots",
      value: `${alerts.length}`,
      trend: alerts.length > 0 ? `${alerts.length} open` : "None open",
      tone: alerts.length > 0 ? "critical" : "good",
    },
    {
      label: "Recall Accuracy",
      value: `${recallAccuracy}%`,
      trend: "Field containment",
      tone: toneFor(recallAccuracy, 95, 85),
    },
    {
      label: "Schedule Adherence",
      value: `${scheduleAdherence}%`,
      tone: toneFor(scheduleAdherence, 90, 75),
    },
  ];
}

export function getMockMetrics(): OverviewMetric[] {
  // Each of these belongs to a module not yet built in this decomposition.
  // Fixed, realistic constants — replace with a real computation when that
  // module lands. Never randomized: a stable demo is more useful than a
  // shifting one for something with no real source data yet.
  return [
    { label: "Materials at Risk", value: "14 SKUs", trend: "↑ from 9 last week", tone: "critical" }, // Inventory module
    { label: "Open Purchase Orders", value: "87", trend: "₹4.2 Cr value", tone: "warning" }, // Purchase module
    { label: "Inventory Health", value: "74 / 100", trend: "Below 80 target", tone: "warning" }, // Inventory module
    { label: "Plan Attainment", value: "94.2%", trend: "Planned vs actual", tone: "good" }, // Material Planning module
    { label: "Forecast Accuracy", value: "85.8%", trend: "WAPE 14.2%", tone: "good" }, // Demand & Forecasting module
    { label: "Order Fill Rate", value: "96.2%", trend: "Last 30 days", tone: "good" }, // Demand & Forecasting module
    { label: "Inventory Turns", value: "9.6x", trend: "38 days of inventory", tone: "good" }, // Inventory module
    { label: "Cash in Inventory", value: "₹6.84 Cr", trend: "-₹1.9L this plan", tone: "good" }, // Inventory module
    { label: "Active Scenarios", value: "2", trend: "15 open exceptions", tone: "warning" }, // Planning Scenarios module
  ];
}

export function getTraceCompletenessByLine(): { line: string; value: number }[] {
  const builds = getBuildRecords();
  const byLine = new Map<string, { pass: number; total: number }>();

  builds.forEach((b) => {
    const entry = byLine.get(b.workCentre) ?? { pass: 0, total: 0 };
    entry.total += 1;
    if (b.designCheckPass && b.supplierCheckPass && b.qcResult !== "fail") entry.pass += 1;
    byLine.set(b.workCentre, entry);
  });

  return Array.from(byLine.entries()).map(([line, { pass, total }]) => ({
    line,
    value: total > 0 ? Math.round((pass / total) * 100) : 0,
  }));
}

export function getMaterialCoverageTrend(): { week: string; series: Record<string, number> }[] {
  // Illustrative only — depends on the Inventory module, not yet built.
  const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
  const base: Record<string, number[]> = {
    "Stearic Acid": [8.5, 7.8, 7.1, 6.4, 5.6, 4.8, 4.1, 3.4],
    "HDPE Resin": [6.1, 5.9, 5.4, 5.0, 4.7, 4.2, 3.8, 3.9],
    "Fragrance Blend": [5.0, 4.6, 4.2, 3.9, 3.5, 3.1, 2.7, 3.0],
    "Titanium Dioxide": [3.2, 3.4, 3.0, 2.8, 2.5, 2.1, 1.9, 2.2],
  };
  return weeks.map((week, i) => ({
    week,
    series: Object.fromEntries(Object.entries(base).map(([material, values]) => [material, values[i]])),
  }));
}

export function getMrpRunStatus(): MrpRunStatus {
  // Illustrative only — depends on the Material Planning module, not yet built.
  return {
    lastRun: "2026-03-23T06:30:00",
    durationSeconds: 252,
    plannedOrders: 312,
    exceptions: 18,
  };
}

export function getStockExhaustionAlerts(): StockExhaustionAlert[] {
  // Illustrative only — depends on the Stock Exhaustion Alerts module, not yet built.
  return [
    { id: "SEA-1", material: "Stearic Acid", quantity: "180 kg", daysOfCoverage: 4.3, action: "Raise PO" },
    { id: "SEA-2", material: "Fragrance Blend FG-04", quantity: "22 L", daysOfCoverage: 3.7, action: "Raise PO" },
    { id: "SEA-3", material: "EDTA Disodium Salt", quantity: "95 kg", daysOfCoverage: 5.1, action: "Raise PO" },
    { id: "SEA-4", material: "Shrink Labels (Type B)", quantity: "1,200 pcs", daysOfCoverage: 6.2, action: "Raise PO" },
    { id: "SEA-5", material: "Titanium Dioxide", quantity: "640 kg", daysOfCoverage: 8.2, action: "Review" },
    { id: "SEA-6", material: "Foil Seals 5L", quantity: "3,400 pcs", daysOfCoverage: 9.1, action: "Review" },
    { id: "SEA-7", material: "Sodium Lauryl Sulphate", quantity: "520 kg", daysOfCoverage: 11.4, action: "Monitor" },
  ];
}

export function getMissingScanExceptions(): MissingScanException[] {
  // Illustrative only — depends on the Material Planning module, not yet built.
  return [
    { id: "MSE-1", workOrderCode: "WO-2026-0862", part: "RM-4023", station: "Mixing Station A", shift: "Shift A", date: "2026-03-18", resolved: false },
    { id: "MSE-2", workOrderCode: "WO-2026-0865", part: "PM-1001", station: "Filling Station B", shift: "Shift B", date: "2026-03-19", resolved: false },
    { id: "MSE-3", workOrderCode: "WO-2026-0870", part: "RM-8012", station: "Fragrance Addition", shift: "Shift A", date: "2026-03-20", resolved: false },
    { id: "MSE-4", workOrderCode: "WO-2026-0872", part: "RM-2087", station: "Mixing Station A", shift: "Shift B", date: "2026-03-20", resolved: true },
    { id: "MSE-5", workOrderCode: "WO-2026-0878", part: "RM-4023", station: "QC Sampling", shift: "Shift A", date: "2026-03-21", resolved: false },
    { id: "MSE-6", workOrderCode: "WO-2026-0880", part: "PM-1001", station: "Filling Station A", shift: "Shift C", date: "2026-03-22", resolved: false },
  ];
}
