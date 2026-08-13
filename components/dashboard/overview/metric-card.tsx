import type { OverviewMetric } from "@/lib/types";

const TONE_BORDER_CLASSES: Record<OverviewMetric["tone"], string> = {
  critical: "border-l-destructive",
  warning: "border-l-amber-500",
  good: "border-l-primary-500",
};

const TONE_TEXT_CLASSES: Record<OverviewMetric["tone"], string> = {
  critical: "text-destructive",
  warning: "text-amber-600",
  good: "text-primary-600",
};

export function MetricCard({ metric }: { metric: OverviewMetric }) {
  return (
    <div className={`space-y-1 rounded-lg border border-l-4 p-4 ${TONE_BORDER_CLASSES[metric.tone]}`}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{metric.label}</p>
      <p className="text-2xl font-semibold">{metric.value}</p>
      {metric.trend && <p className={`text-xs ${TONE_TEXT_CLASSES[metric.tone]}`}>{metric.trend}</p>}
    </div>
  );
}
