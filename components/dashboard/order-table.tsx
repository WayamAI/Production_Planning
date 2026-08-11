"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductionOrder } from "@/lib/types";
import { OrderFormDialog } from "@/components/dashboard/order-form-dialog";
import { DeleteOrderDialog } from "@/components/dashboard/delete-order-dialog";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";

interface OrderTableProps {
  orders: ProductionOrder[];
  onChange: () => void;
}

export function OrderTable({ orders, onChange }: OrderTableProps) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">No production orders yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Scheduled date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>{order.name}</TableCell>
            <TableCell>{order.quantity}</TableCell>
            <TableCell>{order.scheduledDate}</TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell className="flex justify-end gap-2 text-right">
              <OrderFormDialog
                order={order}
                onSaved={onChange}
                trigger={
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                }
              />
              <DeleteOrderDialog orderId={order.id} orderName={order.name} onDeleted={onChange} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
