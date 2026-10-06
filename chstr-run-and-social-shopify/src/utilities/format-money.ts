import { formatPounds } from '@/utilities/format-pounds';

/** Shopify money amounts are decimal strings like "20.0". A zero price is a genuinely free item, shown as "Free". */
export function formatMoney(amount: string): string {
  const pence = Math.round(Number(amount) * 100);
  return pence === 0 ? 'Free' : formatPounds(pence);
}
