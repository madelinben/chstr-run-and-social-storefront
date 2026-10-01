export const ORDER_STATUSES = [
  'PAID_UNFULFILLED',
  'ORDERED_FROM_SUPPLIER',
  'READY_FOR_PICKUP',
  'FULFILLED',
  'REFUNDED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function parseOrderStatus(value: string): OrderStatus {
  const status = ORDER_STATUSES.find((candidate) => candidate === value);
  if (!status) throw new Error(`Unknown order status: ${value}`);
  return status;
}
