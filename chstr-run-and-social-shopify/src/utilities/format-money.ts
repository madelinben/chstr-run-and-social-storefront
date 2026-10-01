import { formatPounds } from '@/utilities/format-pounds';

/** Shopify money amounts are decimal strings like "20.0". */
export function formatMoney(amount: string): string {
  return formatPounds(Math.round(Number(amount) * 100));
}
