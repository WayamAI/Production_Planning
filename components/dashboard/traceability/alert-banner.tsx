"use client";

import type { CriticalAlert } from "@/lib/types";

interface AlertBannerProps {
  alerts: CriticalAlert[];
  onSelect: (query: string) => void;
}

export function AlertBanner({ alerts, onSelect }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
      <span className="font-medium text-destructive">
        ⚠ {alerts.length} critical traceability alert{alerts.length > 1 ? "s" : ""}
      </span>
      {" — "}
      {alerts.map((alert, i) => (
        <span key={alert.query}>
          <button
            type="button"
            className="underline underline-offset-2 hover:no-underline"
            onClick={() => onSelect(alert.query)}
          >
            {alert.label}
          </button>
          {i < alerts.length - 1 ? " · " : ""}
        </span>
      ))}
    </div>
  );
}
