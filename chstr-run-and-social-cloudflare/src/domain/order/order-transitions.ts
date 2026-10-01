import type { OrderStatus } from '@/domain/order/order-status';

const FORWARD_STEP: Record<OrderStatus, OrderStatus | null> = {
  PAID_UNFULFILLED: 'ORDERED_FROM_SUPPLIER',
  ORDERED_FROM_SUPPLIER: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'FULFILLED',
  FULFILLED: null,
  REFUNDED: null,
};

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  if (from === 'REFUNDED') return [];
  const forward = FORWARD_STEP[from];
  return forward ? [forward, 'REFUNDED'] : ['REFUNDED'];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return nextStatuses(from).includes(to);
}
