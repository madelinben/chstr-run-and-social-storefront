import { formatMoney } from '@/utilities/format-money';
import type { ShopifyProduct } from '@/services/shopify/products';

/** What the buyer chooses between, e.g. "Colour" or "Size / Colour". Shopify's placeholder option "Title" means no real choice. */
export function optionLabel(product: Pick<ShopifyProduct, 'options'>): string {
  const names = product.options.map((option) => option.name).filter((name) => name !== 'Title');
  return names.length > 0 ? names.join(' / ') : 'Option';
}

/** One price when every variant matches, otherwise the range ("£18.00 – £22.00", "Free – £22.00"). Free items are fine: they read "Free". */
export function priceSummary(product: Pick<ShopifyProduct, 'variants'>): string {
  const amounts = product.variants.nodes.map((variant) => Number(variant.price.amount));
  if (amounts.length === 0) return '';
  const [low, high] = [Math.min(...amounts), Math.max(...amounts)];
  return low === high ? formatMoney(String(low)) : `${formatMoney(String(low))} – ${formatMoney(String(high))}`;
}

/** True when sizes or colours are priced differently, so each choice must show its own price. */
export function pricesVary(product: Pick<ShopifyProduct, 'variants'>): boolean {
  return new Set(product.variants.nodes.map((variant) => Number(variant.price.amount))).size > 1;
}

/** Product has a size choice, so the size guide applies. */
export function hasSizeOption(product: Pick<ShopifyProduct, 'options'>): boolean {
  return product.options.some((option) => option.name.trim().toLowerCase() === 'size');
}

/** The slice of each variant the add-to-cart form needs. */
export function formVariants(product: Pick<ShopifyProduct, 'variants'>) {
  return product.variants.nodes.map((variant) => ({ id: variant.id, title: variant.title, availableForSale: variant.availableForSale, price: variant.price.amount }));
}
