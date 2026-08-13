"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMrpRunStatus } from "@/lib/overview";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MrpRunPanel() {
  const status = getMrpRunStatus();

  function handleRerun() {
    toast.info(
      "MRP re-run isn't available in this preview yet — full MRP lands with the Material Planning module."
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">MRP Run Status</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last Run</span>
          <span>{formatDateTime(status.lastRun)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span>
            {Math.floor(status.durationSeconds / 60)}m {status.durationSeconds % 60}s
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Planned Orders</span>
          <span>{status.plannedOrders}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Exceptions</span>
          <span className="text-destructive">{status.exceptions}</span>
        </div>
      </div>
      <Button className="w-full" onClick={handleRerun}>
        Re-run MRP Now
      </Button>
    </div>
  );
}
