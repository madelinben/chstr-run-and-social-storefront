import { parseOrderStatus } from '@/domain/order/order-status';
import { canTransition } from '@/domain/order/order-transitions';
import { selectOrderStatus, updateStatus } from '@/data/Order/order-dal';
import type { ServerEnvironment } from '@/services/environment/server-environment';

export async function updateOrderStatus(orderId: number, requestedStatus: string, env: ServerEnvironment) {
  const to = parseOrderStatus(requestedStatus);
  const current = await selectOrderStatus(env.DB, orderId);
  if (current === null) throw new Error(`Order ${orderId} does not exist.`);
  const from = parseOrderStatus(current);
  if (!canTransition(from, to)) throw new Error(`Order ${orderId} cannot move from ${from} to ${to}.`);
  const changed = await updateStatus(env.DB, orderId, from, to, new Date().toISOString());
  if (!changed) throw new Error(`Order ${orderId} was changed by someone else. Reload and try again.`);
}
