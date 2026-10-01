import { describe, expect, it } from 'vitest';
import { priceCart } from '@/domain/cart/cart-total';

const catalogue = new Map([['club-tee', { name: 'Club Tee', pricePence: 2000, sizes: ['S', 'M'] }]]);

describe('priceCart', () => {
  it('totals lines using catalogue prices', () => {
    const { totalPence } = priceCart([{ productSlug: 'club-tee', size: 'M', quantity: 3 }], catalogue);
    expect(totalPence).toBe(6000);
  });

  it('rejects unknown products, sizes, quantities and empty carts', () => {
    expect(() => priceCart([], catalogue)).toThrow();
    expect(() => priceCart([{ productSlug: 'nope', size: 'M', quantity: 1 }], catalogue)).toThrow('Unknown product');
    expect(() => priceCart([{ productSlug: 'club-tee', size: 'XL', quantity: 1 }], catalogue)).toThrow('Unknown size');
    expect(() => priceCart([{ productSlug: 'club-tee', size: 'S', quantity: 0 }], catalogue)).toThrow('Quantity');
  });
});
