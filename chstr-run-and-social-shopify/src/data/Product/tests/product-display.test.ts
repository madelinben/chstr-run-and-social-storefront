import { describe, expect, it } from 'vitest';
import { hasSizeOption, optionLabel, priceSummary, pricesVary } from '@/data/Product/product-display';
import type { ShopifyProduct } from '@/services/shopify/products';

const product = (prices: string[], optionNames = ['Color']): ShopifyProduct => ({
  id: 'p', handle: 'p', title: 'p', description: '', featuredImage: null, options: optionNames.map((name) => ({ name })), images: { nodes: [] },
  variants: { nodes: prices.map((amount, index) => ({ id: `v${index}`, title: `v${index}`, availableForSale: true, price: { amount, currencyCode: 'GBP' } })) },
});

describe('priceSummary', () => {
  it('shows one price when all variants match', () => {
    expect(priceSummary(product(['22.0', '22.0']))).toBe('£22.00');
  });

  it('shows a range when variants differ, and a free item as Free', () => {
    expect(priceSummary(product(['18.0', '22.0']))).toBe('£18.00 – £22.00');
    expect(priceSummary(product(['0.0', '22.0']))).toBe('Free – £22.00');
    expect(priceSummary(product(['0.0']))).toBe('Free');
  });

  it('is empty for a product with no variants', () => {
    expect(priceSummary(product([]))).toBe('');
  });
});

describe('pricesVary', () => {
  it('detects differently priced variants', () => {
    expect(pricesVary(product(['22.0', '22.0']))).toBe(false);
    expect(pricesVary(product(['0.0', '22.0']))).toBe(true);
  });
});

describe('optionLabel and hasSizeOption', () => {
  it('uses the real option names and ignores the placeholder Title', () => {
    expect(optionLabel(product(['1.0'], ['Size', 'Color']))).toBe('Size / Color');
    expect(optionLabel(product(['1.0'], ['Title']))).toBe('Option');
  });

  it('finds a Size option however it is capitalised', () => {
    expect(hasSizeOption(product(['1.0'], ['Colour', 'SIZE']))).toBe(true);
    expect(hasSizeOption(product(['1.0'], ['Color']))).toBe(false);
  });
});
