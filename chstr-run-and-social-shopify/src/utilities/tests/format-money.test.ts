import { expect, test } from 'vitest';
import { formatMoney } from '@/utilities/format-money';

test('formats Shopify decimal strings as pounds', () => {
  expect(formatMoney('20.0')).toBe('£20.00');
  expect(formatMoney('12.5')).toBe('£12.50');
});
