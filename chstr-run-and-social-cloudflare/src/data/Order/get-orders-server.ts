import { selectOrderLines, selectOrders } from '@/data/Order/order-dal';
import { toOrderViews } from '@/data/Order/order-dto';
import type { ServerEnvironment } from '@/services/environment/server-environment';

export async function getOrdersServer(env: ServerEnvironment) {
  const orders = await selectOrders(env.DB);
  const lines = await selectOrderLines(env.DB, orders.map((order) => order.id));
  return toOrderViews(orders, lines);
}
