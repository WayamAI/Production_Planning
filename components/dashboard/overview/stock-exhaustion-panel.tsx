import { getStockExhaustionAlerts } from "@/lib/overview";

export function StockExhaustionPanel() {
  const alerts = getStockExhaustionAlerts();

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Stock Exhaustion Alerts</p>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between border-t pt-2 text-sm first:border-t-0 first:pt-0"
          >
            <div>
              <p className="font-medium">{alert.material}</p>
              <p className="text-xs text-muted-foreground">
                {alert.quantity} · {alert.daysOfCoverage}d
              </p>
            </div>
            <span className="text-xs font-medium text-primary-600">{alert.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
