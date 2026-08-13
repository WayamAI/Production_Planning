"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createOrder, updateOrder } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus, ProductionLine, ProductionOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderFormDialogProps {
  order?: ProductionOrder;
  onSaved: () => void;
  trigger: React.ReactNode;
}

const PRODUCTION_LINES: ProductionLine[] = ["Line 1", "Line 2", "Line 3", "Line 4"];
const ORDER_STATUSES: OrderStatus[] = [
  "draft",
  "released",
  "in_progress",
  "completed",
  "on_hold",
  "overdue",
];

const EMPTY_FORM = {
  name: "",
  quantity: "",
  producedQty: "0",
  scheduledDate: "",
  dueDate: "",
  line: "Line 1" as ProductionLine,
  bomVersion: "",
  status: "draft" as OrderStatus,
};

export function OrderFormDialog({ order, onSaved, trigger }: OrderFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setForm(
        order
          ? {
              name: order.name,
              quantity: String(order.quantity),
              producedQty: String(order.producedQty),
              scheduledDate: order.scheduledDate,
              dueDate: order.dueDate,
              line: order.line,
              bomVersion: order.bomVersion,
              status: order.status,
            }
          : EMPTY_FORM
      );
      setError(null);
    }
    setOpen(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantity = Number(form.quantity);
    const producedQty = Number(form.producedQty);

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }
    if (!Number.isFinite(producedQty) || producedQty < 0 || producedQty > quantity) {
      setError("Produced quantity must be between 0 and the ordered quantity.");
      return;
    }
    if (!form.scheduledDate) {
      setError("Scheduled date is required.");
      return;
    }
    if (!form.dueDate) {
      setError("Due date is required.");
      return;
    }
    if (!form.bomVersion.trim()) {
      setError("BOM version is required.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        quantity,
        producedQty,
        scheduledDate: form.scheduledDate,
        dueDate: form.dueDate,
        line: form.line,
        bomVersion: form.bomVersion.trim(),
        status: form.status,
      };

      if (order) {
        updateOrder(order.id, payload);
        toast.success("Order updated");
      } else {
        createOrder(payload);
        toast.success("Order created");
      }
      setOpen(false);
      onSaved();
    } catch {
      toast.error("Could not save the order. Storage may be unavailable.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{order ? "Edit order" : "New order"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="order-name">Name</Label>
            <Input
              id="order-name"
              value={form.name}
              onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order-quantity">Quantity</Label>
              <Input
                id="order-quantity"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(event) => setForm((f) => ({ ...f, quantity: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-produced">Produced qty</Label>
              <Input
                id="order-produced"
                type="number"
                min={0}
                value={form.producedQty}
                onChange={(event) => setForm((f) => ({ ...f, producedQty: event.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order-date">Scheduled date</Label>
              <Input
                id="order-date"
                type="date"
                value={form.scheduledDate}
                onChange={(event) => setForm((f) => ({ ...f, scheduledDate: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-due-date">Due date</Label>
              <Input
                id="order-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((f) => ({ ...f, dueDate: event.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order-line">Line</Label>
              <Select
                value={form.line}
                onValueChange={(value) => setForm((f) => ({ ...f, line: value as ProductionLine }))}
              >
                <SelectTrigger id="order-line">
                  <SelectValue>{(value: ProductionLine | null) => value ?? ""}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTION_LINES.map((line) => (
                    <SelectItem key={line} value={line}>
                      {line}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-bom">BOM version</Label>
              <Input
                id="order-bom"
                placeholder="v1.0"
                value={form.bomVersion}
                onChange={(event) => setForm((f) => ({ ...f, bomVersion: event.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm((f) => ({ ...f, status: value as OrderStatus }))}
            >
              <SelectTrigger id="order-status">
                <SelectValue>
                  {(value: OrderStatus | null) => (value ? ORDER_STATUS_LABELS[value] : "")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit">{order ? "Save changes" : "Create order"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
