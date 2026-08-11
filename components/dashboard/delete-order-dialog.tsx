"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteOrder } from "@/lib/orders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteOrderDialogProps {
  orderId: string;
  orderName: string;
  onDeleted: () => void;
}

export function DeleteOrderDialog({ orderId, orderName, onDeleted }: DeleteOrderDialogProps) {
  const [open, setOpen] = useState(false);

  function handleDelete() {
    deleteOrder(orderId);
    toast.success("Order deleted");
    setOpen(false);
    onDeleted();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            Delete
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{orderName}&rdquo;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">This cannot be undone.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
