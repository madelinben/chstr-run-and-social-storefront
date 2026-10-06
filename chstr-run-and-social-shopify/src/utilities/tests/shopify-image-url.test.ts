import { describe, expect, it } from 'vitest';
import { shopifyImageUrl, shopifySrcSet } from '@/utilities/shopify-image-url';

const cdn = 'https://cdn.shopify.com/s/files/1/0000/products/tee.jpg?v=123';

describe('shopifyImageUrl', () => {
  it('adds width and keeps existing query', () => {
    const url = new URL(shopifyImageUrl(cdn, 800));
    expect(url.searchParams.get('width')).toBe('800');
    expect(url.searchParams.get('v')).toBe('123');
  });

  it('crops to the box when a height is given', () => {
    const url = new URL(shopifyImageUrl(cdn, 1200, 630));
    expect([url.searchParams.get('height'), url.searchParams.get('crop')]).toEqual(['630', 'center']);
  });

  it('leaves other hosts and local paths alone', () => {
    expect(shopifyImageUrl('/images/a.svg', 800)).toBe('/images/a.svg');
    expect(shopifyImageUrl('https://example.com/a.jpg', 800)).toBe('https://example.com/a.jpg');
  });
});

describe('shopifySrcSet', () => {
  it('lists each width, cropped to the aspect when asked', () => {
    const set = shopifySrcSet(cdn, [400, 800], 1);
    expect(set.split(', ')).toHaveLength(2);
    expect(set).toContain('800w');
    expect(set).toContain('height=800');
    expect(shopifySrcSet(cdn, [400], 4 / 3)).toContain('height=300');
  });

  it('is empty for non-Shopify URLs', () => {
    expect(shopifySrcSet('/images/a.svg', [400])).toBe('');
  });
});
