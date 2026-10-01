import { describe, expect, it } from 'vitest';
import { buildTitle, productMetaDescription } from '@/features/site-seo/utilities/meta-text';

describe('buildTitle', () => {
  it('appends the brand when it fits', () => {
    expect(buildTitle('Club Merchandise')).toBe('Club Merchandise – CHSTR Run & Social');
  });

  it('drops the brand for a long product name, then truncates a very long one', () => {
    const long = 'CHSTR Club Tee Lime Green Unisex Heavyweight';
    expect(buildTitle(long)).toBe(long);
    const huge = 'CHSTR Club Tee Lime Green Unisex Heavyweight Cotton Limited Edition Anniversary';
    expect(buildTitle(huge).length).toBeLessThanOrEqual(60);
    expect(buildTitle(huge).endsWith('…')).toBe(true);
  });

  it('honours an absolute title', () => {
    expect(buildTitle('Home', 'CHSTR Run & Social: Free Monday Run Club in Chester')).toBe('CHSTR Run & Social: Free Monday Run Club in Chester');
  });
});

describe('productMetaDescription', () => {
  it('pads a missing description with the pickup facts', () => {
    const text = productMetaDescription('Run Cap', '£15.00', '');
    expect(text.length).toBeGreaterThanOrEqual(70);
    expect(text).toContain('collect it at a Monday CHSTR run');
  });

  it('caps a long description at 160 chars on a word boundary', () => {
    const text = productMetaDescription('Tee', '£20.00', 'word '.repeat(80));
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text.endsWith('…')).toBe(true);
  });

  it('keeps a good description untouched', () => {
    const description = 'Soft cotton tee in CHSTR ink and lime with the bubble logo on the chest and back.';
    expect(productMetaDescription('Tee', '£20.00', description)).toBe(`Tee, £20.00. ${description}`);
  });
});
