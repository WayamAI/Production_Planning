"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/orders";
import { formatRelativeTime, formatWorkOrderId, getScheduleUpdates } from "@/lib/production";
import { SCHEDULE_UPDATE_TYPE_CLASSES, SCHEDULE_UPDATE_TYPE_LABELS } from "@/lib/production-status";

export function ScheduleUpdatesFeed() {
  const [refreshKey, setRefreshKey] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey intentionally re-triggers a fresh read
  const updates = useMemo(() => getScheduleUpdates(), [refreshKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey intentionally re-triggers a fresh read
  const orders = useMemo(() => getOrders(), [refreshKey]);

  if (updates.length === 0) {
    return <p className="text-sm text-muted-foreground">No schedule updates yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary-500" /> Live
        </span>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
          Refresh
        </Button>
      </div>
      <ul className="space-y-3">
        {updates.map((u) => {
          const order = orders.find((o) => o.id === u.orderId);
          return (
            <li key={u.id} className="space-y-1 border-b pb-3 text-sm">
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-xs ${SCHEDULE_UPDATE_TYPE_CLASSES[u.type]}`}
              >
                {SCHEDULE_UPDATE_TYPE_LABELS[u.type]}
              </span>
              <p>{u.description}</p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(u.minutesAgo)} · by {u.actor}
                {order && <> · {formatWorkOrderId(order)}</>}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
