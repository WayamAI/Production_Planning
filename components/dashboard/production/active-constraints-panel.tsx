import { getConstraints } from "@/lib/production";
import { CONSTRAINT_SEVERITY_CLASSES, CONSTRAINT_TYPE_LABELS } from "@/lib/production-status";

export function ActiveConstraintsPanel() {
  const constraints = getConstraints()
    .filter((c) => c.status === "open" || c.status === "scheduled")
    .slice(0, 3);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Active Constraints ({constraints.length})</p>
      {constraints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active constraints.</p>
      ) : (
        constraints.map((c) => (
          <div key={c.id} className="space-y-1 border-t pt-3 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{CONSTRAINT_TYPE_LABELS[c.type]}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${CONSTRAINT_SEVERITY_CLASSES[c.severity]}`}
              >
                {c.severity}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{c.impact}</p>
          </div>
        ))
      )}
    </div>
  );
}
