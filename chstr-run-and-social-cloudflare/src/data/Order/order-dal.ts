import type { DatabaseBinding } from '@/services/db/orders-database';

export interface OrderRow {
  id: number;
  payment_provider: string;
  payment_reference: string;
  customer_email: string;
  customer_phone: string | null;
  status: string;
  created_at: string;
}

export interface OrderLineRow {
  order_id: number;
  product_slug: string;
  size: string;
  quantity: number;
  unit_price_pence: number;
}

export interface NewOrder {
  paymentProvider: string;
  paymentReference: string;
  customerEmail: string;
  customerPhone: string | null;
  lines: { productSlug: string; size: string; quantity: number; unitPricePence: number }[];
}

const ORDER_COLUMNS = 'id, payment_provider, payment_reference, customer_email, customer_phone, status, created_at';

/** Returns the new order id, or null when this payment was already stored (replayed webhook). */
export async function insertOrder(db: DatabaseBinding, order: NewOrder, now: string): Promise<number | null> {
  const existing = await db.prepare('SELECT id FROM orders WHERE payment_provider = ? AND payment_reference = ?').bind(order.paymentProvider, order.paymentReference).first<{ id: number }>();
  if (existing) return null;

  const insertOrderStatement = db
    .prepare('INSERT INTO orders (payment_provider, payment_reference, customer_email, customer_phone, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(order.paymentProvider, order.paymentReference, order.customerEmail, order.customerPhone, 'PAID_UNFULFILLED', now, now);
  const lineStatements = order.lines.map((line) =>
    db
      .prepare('INSERT INTO order_lines (order_id, product_slug, size, quantity, unit_price_pence) VALUES ((SELECT id FROM orders WHERE payment_provider = ? AND payment_reference = ?), ?, ?, ?, ?)')
      .bind(order.paymentProvider, order.paymentReference, line.productSlug, line.size, line.quantity, line.unitPricePence),
  );
  const results = await db.batch([insertOrderStatement, ...lineStatements]);
  return results[0].meta.last_row_id;
}

export async function selectOrders(db: DatabaseBinding): Promise<OrderRow[]> {
  const { results } = await db.prepare(`SELECT ${ORDER_COLUMNS} FROM orders ORDER BY created_at DESC LIMIT 200`).all<OrderRow>();
  return results;
}

export async function selectOrderLines(db: DatabaseBinding, orderIds: number[]): Promise<OrderLineRow[]> {
  if (orderIds.length === 0) return [];
  const placeholders = orderIds.map(() => '?').join(', ');
  const { results } = await db
    .prepare(`SELECT order_id, product_slug, size, quantity, unit_price_pence FROM order_lines WHERE order_id IN (${placeholders})`)
    .bind(...orderIds)
    .all<OrderLineRow>();
  return results;
}

export async function selectOrderStatus(db: DatabaseBinding, orderId: number): Promise<string | null> {
  const row = await db.prepare('SELECT status FROM orders WHERE id = ?').bind(orderId).first<{ status: string }>();
  return row?.status ?? null;
}

/** Optimistic: only updates when the status is still what the caller saw. Returns whether a row changed. */
export async function updateStatus(db: DatabaseBinding, orderId: number, from: string, to: string, now: string): Promise<boolean> {
  const result = await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND status = ?').bind(to, now, orderId, from).run();
  return result.meta.changes > 0;
}
