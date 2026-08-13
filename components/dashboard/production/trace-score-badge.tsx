import { getTraceScore } from "@/lib/production";
import type { ProductionOrder } from "@/lib/types";

const BAND_CLASSES: Record<"green" | "amber" | "red", string> = {
  green: "bg-primary-500",
  amber: "bg-amber-500",
  red: "bg-destructive",
};

export function TraceScoreBadge({ order }: { order: ProductionOrder }) {
  const score = getTraceScore(order);
  if (!score) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full ${BAND_CLASSES[score.band]}`}
          style={{ width: `${score.percent}%` }}
        />
      </div>
      <span className="text-xs font-medium">{score.percent}%</span>
    </div>
  );
}
