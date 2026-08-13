import { getTraceCompletenessByLine } from "@/lib/overview";

export function TraceLineChart() {
  const data = getTraceCompletenessByLine();

  if (data.length === 0) {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Trace Completeness by Assembly Line</p>
        <p className="text-sm text-muted-foreground">No build records yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Trace Completeness by Assembly Line</p>
      <div className="space-y-2">
        {data.map((entry) => (
          <div key={entry.line} className="grid grid-cols-[140px_1fr_40px] items-center gap-3 text-sm">
            <span className="text-muted-foreground">{entry.line}</span>
            <div className="h-3 rounded-full bg-muted">
              <div className="h-3 rounded-full bg-primary-500" style={{ width: `${entry.value}%` }} />
            </div>
            <span className="text-right font-medium">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
