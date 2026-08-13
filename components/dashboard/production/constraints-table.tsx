"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getConstraints } from "@/lib/production";
import {
  CONSTRAINT_SEVERITY_CLASSES,
  CONSTRAINT_STATUS_CLASSES,
  CONSTRAINT_TYPE_LABELS,
} from "@/lib/production-status";

export function ConstraintsTable() {
  const constraints = useMemo(() => getConstraints(), []);

  const counts = useMemo(
    () => ({
      open: constraints.filter((c) => c.status === "open").length,
      mitigated: constraints.filter((c) => c.status === "mitigated").length,
      scheduled: constraints.filter((c) => c.status === "scheduled").length,
      resolved: constraints.filter((c) => c.status === "resolved").length,
    }),
    [constraints]
  );

  if (constraints.length === 0) {
    return <p className="text-sm text-muted-foreground">No constraints recorded.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <span>
          Open: <strong>{counts.open}</strong>
        </span>
        <span>
          Mitigated: <strong>{counts.mitigated}</strong>
        </span>
        <span>
          Scheduled: <strong>{counts.scheduled}</strong>
        </span>
        <span>
          Resolved: <strong>{counts.resolved}</strong>
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Impact</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Resolution</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {constraints.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-mono text-xs">{c.id}</TableCell>
              <TableCell>{CONSTRAINT_TYPE_LABELS[c.type]}</TableCell>
              <TableCell>{c.resource}</TableCell>
              <TableCell className="max-w-xs truncate" title={c.impact}>
                {c.impact}
              </TableCell>
              <TableCell>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs ${CONSTRAINT_SEVERITY_CLASSES[c.severity]}`}
                >
                  {c.severity}
                </span>
              </TableCell>
              <TableCell>{c.date}</TableCell>
              <TableCell className="max-w-xs truncate" title={c.resolution}>
                {c.resolution}
              </TableCell>
              <TableCell>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs ${CONSTRAINT_STATUS_CLASSES[c.status]}`}
                >
                  {c.status}
                </span>
              </TableCell>
              <TableCell>{c.owner}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
