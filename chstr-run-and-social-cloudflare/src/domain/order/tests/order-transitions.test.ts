import { describe, expect, it } from 'vitest';
import { parseOrderStatus } from '@/domain/order/order-status';
import { canTransition, nextStatuses } from '@/domain/order/order-transitions';

describe('order transitions', () => {
  it('moves forward one step at a time', () => {
    expect(canTransition('PAID_UNFULFILLED', 'ORDERED_FROM_SUPPLIER')).toBe(true);
    expect(canTransition('PAID_UNFULFILLED', 'FULFILLED')).toBe(false);
    expect(canTransition('READY_FOR_PICKUP', 'FULFILLED')).toBe(true);
  });

  it('allows refund from any paid state but not from refunded', () => {
    expect(canTransition('FULFILLED', 'REFUNDED')).toBe(true);
    expect(nextStatuses('REFUNDED')).toEqual([]);
  });

  it('rejects unknown statuses loudly', () => {
    expect(() => parseOrderStatus('paid')).toThrow('Unknown order status');
  });
});
