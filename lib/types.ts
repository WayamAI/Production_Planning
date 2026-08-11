export type OrderStatus = "pending" | "in_progress" | "done";

export interface ProductionOrder {
  id: string;
  name: string;
  quantity: number;
  scheduledDate: string; // ISO date, e.g. "2026-08-20"
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  name: string;
  quantity: number;
  scheduledDate: string;
  status: OrderStatus;
}

export type UpdateOrderInput = Partial<CreateOrderInput>;
