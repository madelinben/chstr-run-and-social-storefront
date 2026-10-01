import { describe, expect, it } from 'vitest';
import { checkoutRequestSchema } from '@/data/Checkout/checkout-request-schema';

describe('checkoutRequestSchema', () => {
  it('accepts slug, size and quantity only', () => {
    const parsed = checkoutRequestSchema.safeParse({ lines: [{ productSlug: 'club-tee', size: 'M', quantity: 2 }] });
    expect(parsed.success).toBe(true);
  });

  it('rejects empty carts and oversized quantities', () => {
    expect(checkoutRequestSchema.safeParse({ lines: [] }).success).toBe(false);
    expect(checkoutRequestSchema.safeParse({ lines: [{ productSlug: 'a', size: 'M', quantity: 99 }] }).success).toBe(false);
  });
});
