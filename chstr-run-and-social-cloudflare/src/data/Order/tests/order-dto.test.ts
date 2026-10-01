import { describe, expect, it } from 'vitest';
import { toOrderViews } from '@/data/Order/order-dto';

const order = { id: 1, payment_provider: 'stripe', payment_reference: 's', customer_email: 'a@b.c', customer_phone: null, status: 'PAID_UNFULFILLED', created_at: '2026-01-01T00:00:00.000Z' };

describe('toOrderViews', () => {
  it('attaches lines and totals them', () => {
    const [view] = toOrderViews([order], [{ order_id: 1, product_slug: 'club-tee', size: 'M', quantity: 2, unit_price_pence: 2000 }]);
    expect(view.totalPence).toBe(4000);
    expect(view.status).toBe('PAID_UNFULFILLED');
  });

  it('fails loudly on an unknown stored status', () => {
    expect(() => toOrderViews([{ ...order, status: 'paid' }], [])).toThrow('Unknown order status');
  });
});
