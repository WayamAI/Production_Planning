import { getOrders } from "@/lib/orders";
import { getTraceScore } from "@/lib/production";
import { getCriticalAlerts, getPopulationAtRisk } from "@/lib/traceability";
import type { OverviewMetric } from "@/lib/types";

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
