"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMissingScanExceptions } from "@/lib/overview";

export function MissingScanTable() {
  const [exceptions, setExceptions] = useState(getMissingScanExceptions);

  function handleResolve(id: string) {
    setExceptions((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
  }

  const unresolvedCount = exceptions.filter((e) => !e.resolved).length;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Missing Scan Exceptions</p>
        <span className="text-xs text-muted-foreground">{unresolvedCount} unresolved</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Work Order</TableHead>
            <TableHead>Part</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Shift</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exceptions.map((exception) => (
            <TableRow key={exception.id}>
              <TableCell className="font-mono text-xs">{exception.workOrderCode}</TableCell>
              <TableCell>{exception.part}</TableCell>
              <TableCell>{exception.station}</TableCell>
              <TableCell>{exception.shift}</TableCell>
              <TableCell>{exception.date}</TableCell>
              <TableCell className="text-right">
                {exception.resolved ? (
                  <span className="text-xs text-muted-foreground">Resolved</span>
                ) : (
                  <Button size="sm" onClick={() => handleResolve(exception.id)}>
                    Resolve
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
