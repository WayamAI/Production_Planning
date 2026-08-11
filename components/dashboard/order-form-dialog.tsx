"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createOrder, updateOrder } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus, ProductionOrder } from "@/lib/types";
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

const EMPTY_FORM = { name: "", quantity: "", scheduledDate: "", status: "pending" as OrderStatus };

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
              scheduledDate: order.scheduledDate,
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
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }
    if (!form.scheduledDate) {
      setError("Scheduled date is required.");
      return;
    }

    try {
      if (order) {
        updateOrder(order.id, {
          name: form.name.trim(),
          quantity,
          scheduledDate: form.scheduledDate,
          status: form.status,
        });
        toast.success("Order updated");
      } else {
        createOrder({
          name: form.name.trim(),
          quantity,
          scheduledDate: form.scheduledDate,
          status: form.status,
        });
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
            <Label htmlFor="order-date">Scheduled date</Label>
            <Input
              id="order-date"
              type="date"
              value={form.scheduledDate}
              onChange={(event) => setForm((f) => ({ ...f, scheduledDate: event.target.value }))}
            />
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
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
