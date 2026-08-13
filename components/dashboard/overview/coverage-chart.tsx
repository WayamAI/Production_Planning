import { getMaterialCoverageTrend } from "@/lib/overview";

const SERIES_COLORS = ["#F0731A", "#16A34A", "#2563EB", "#9333EA"];
const WIDTH = 480;
const HEIGHT = 200;
const PADDING = 24;

export function CoverageChart() {
  const trend = getMaterialCoverageTrend();
  const materials = Object.keys(trend[0]?.series ?? {});
  const maxValue = Math.max(...trend.flatMap((point) => Object.values(point.series)), 1);

  function toXY(index: number, value: number): [number, number] {
    const x = PADDING + (index / (trend.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - (value / maxValue) * (HEIGHT - PADDING * 2);
    return [x, y];
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Material Coverage Trend (Weeks)</p>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Material coverage trend in weeks of stock"
      >
        {materials.map((material, mi) => {
          const points = trend
            .map((point, i) => toXY(i, point.series[material]))
            .map(([x, y]) => `${x},${y}`)
            .join(" ");
          return (
            <polyline
              key={material}
              points={points}
              fill="none"
              stroke={SERIES_COLORS[mi % SERIES_COLORS.length]}
              strokeWidth={2}
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {materials.map((material, mi) => (
          <span key={material} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: SERIES_COLORS[mi % SERIES_COLORS.length] }}
            />
            {material}
          </span>
        ))}
      </div>
    </div>
  );
}
