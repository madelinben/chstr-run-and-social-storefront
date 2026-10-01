import { parseOrderStatus, type OrderStatus } from '@/domain/order/order-status';
import type { OrderLineRow, OrderRow } from '@/data/Order/order-dal';

export interface OrderView {
  id: number;
  customerEmail: string;
  customerPhone: string | null;
  status: OrderStatus;
  createdAt: string;
  lines: { productSlug: string; size: string; quantity: number; unitPricePence: number }[];
  totalPence: number;
}

export function toOrderViews(orders: OrderRow[], lines: OrderLineRow[]): OrderView[] {
  return orders.map((order) => {
    const orderLines = lines
      .filter((line) => line.order_id === order.id)
      .map((line) => ({ productSlug: line.product_slug, size: line.size, quantity: line.quantity, unitPricePence: line.unit_price_pence }));
    return {
      id: order.id,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      status: parseOrderStatus(order.status),
      createdAt: order.created_at,
      lines: orderLines,
      totalPence: orderLines.reduce((sum, line) => sum + line.unitPricePence * line.quantity, 0),
    };
  });
}
