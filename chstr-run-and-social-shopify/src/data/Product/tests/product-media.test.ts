import { describe, expect, it } from 'vitest';
import { getLocalMedia, leadMedia } from '@/data/Product/product-media';
import type { ShopifyProduct } from '@/services/shopify/products';

const variants = (rows: [string, boolean][]) => ({ variants: { nodes: rows.map(([title, availableForSale], index) => ({ id: `v${index}`, title, availableForSale, price: { amount: '1.0', currencyCode: 'GBP' } })) } }) as Pick<ShopifyProduct, 'variants'>;

describe('getLocalMedia', () => {
  it('finds pictures by handle, and reports none for an unknown product', () => {
    expect(getLocalMedia({ handle: 'jumper' })?.map((entry) => entry.colour)).toEqual(['Grey', 'Blue']);
    expect(getLocalMedia({ handle: 'not-in-the-table' })).toBeUndefined();
  });

  it('gives every colour a front and a share image (dimensions are checked by the build)', () => {
    for (const handle of ['technical-running-cap', 'activewear-unisex-t-shirt-white', 'activewear-unisex-longsleeve-t-shirt-white', 'cool-flex-long-half-zip-top-black', 'jumper', 'womens-tridri-organic-crop-tank']) {
      const colours = getLocalMedia({ handle });
      expect(colours?.length).toBeGreaterThan(0);
      for (const entry of colours ?? []) {
        expect(entry.front).toBeTruthy();
        expect(entry.og).toBeTruthy();
      }
    }
  });
});

describe('leadMedia', () => {
  const media = getLocalMedia({ handle: 'jumper' })!;

  it('leads with the first in-stock variant that has pictures', () => {
    expect(leadMedia(media, variants([['Grey', false], ['Blue', true]])).colour).toBe('Blue');
  });

  it('falls back to the first variant when nothing is in stock, and to the first picture set when no colour matches', () => {
    expect(leadMedia(media, variants([['Blue', false], ['Grey', false]])).colour).toBe('Blue');
    expect(leadMedia(media, variants([['Red', true]])).colour).toBe('Grey');
  });

  it('matches a colour inside a multi-option title such as "L / Blue"', () => {
    expect(leadMedia(media, variants([['L / Blue', true]])).colour).toBe('Blue');
  });
});
