import { describe, expect, it } from 'vitest';
import { optionLabel, splitSellable } from '@/data/Product/sellable-products';
import type { ShopifyProduct } from '@/services/shopify/products';

const product = (title: string, prices: string[], optionNames = ['Color']): ShopifyProduct => ({
  id: title, handle: title, title, description: '', featuredImage: null, options: optionNames.map((name) => ({ name })), images: { nodes: [] },
  variants: { nodes: prices.map((amount, index) => ({ id: `${title}${index}`, title: `v${index}`, availableForSale: true, price: { amount, currencyCode: 'GBP' } })) },
});

describe('splitSellable', () => {
  it('keeps priced products and sets aside any with a £0.00 variant', () => {
    const { sellable, unpriced } = splitSellable([product('cap', ['15.0']), product('tee', ['0.0', '0.0']), product('hoodie', ['30.0', '0.0'])]);
    expect(sellable.map((item) => item.title)).toEqual(['cap']);
    expect(unpriced.map((item) => item.title)).toEqual(['tee', 'hoodie']);
  });

  it('treats a product with no variants as unfinished', () => {
    expect(splitSellable([product('empty', [])]).unpriced).toHaveLength(1);
  });
});

describe('optionLabel', () => {
  it('uses the real option names', () => {
    expect(optionLabel(product('a', ['1.0'], ['Size', 'Color']))).toBe('Size / Color');
  });

  it('ignores Shopify\'s placeholder Title option', () => {
    expect(optionLabel(product('a', ['1.0'], ['Title']))).toBe('Option');
  });
});
