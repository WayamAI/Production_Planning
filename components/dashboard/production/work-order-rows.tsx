import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { TraceScoreBadge } from "@/components/dashboard/production/trace-score-badge";
import { formatWorkOrderId } from "@/lib/production";
import type { ProductionOrder } from "@/lib/types";

interface WorkOrderRowsProps {
  orders: ProductionOrder[];
}

export function WorkOrderRows({ orders }: WorkOrderRowsProps) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">No work orders match this view.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Work Order</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Ordered</TableHead>
          <TableHead>Produced</TableHead>
          <TableHead>BOM</TableHead>
          <TableHead>Scheduled</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Line</TableHead>
          <TableHead>Trace %</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-mono text-xs">{formatWorkOrderId(order)}</TableCell>
            <TableCell>{order.name}</TableCell>
            <TableCell>{order.quantity.toLocaleString()}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-12 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary-500"
                    style={{
                      width: `${order.quantity > 0 ? Math.min(100, Math.round((order.producedQty / order.quantity) * 100)) : 0}%`,
                    }}
                  />
                </div>
                <span>{order.producedQty.toLocaleString()}</span>
              </div>
            </TableCell>
            <TableCell>{order.bomVersion}</TableCell>
            <TableCell>{order.scheduledDate}</TableCell>
            <TableCell>{order.dueDate}</TableCell>
            <TableCell>{order.line}</TableCell>
            <TableCell>
              <TraceScoreBadge order={order} />
            </TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
