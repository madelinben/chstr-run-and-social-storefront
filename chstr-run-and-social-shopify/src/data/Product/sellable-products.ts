import type { ShopifyProduct } from '@/services/shopify/products';

/** A product with any £0.00 variant is an unfinished listing: showing it would advertise free merchandise and put a £0 Offer in search results. */
export function splitSellable(products: ShopifyProduct[]) {
  const unpriced = products.filter((product) => product.variants.nodes.length === 0 || product.variants.nodes.some((variant) => !(Number(variant.price.amount) > 0)));
  return { sellable: products.filter((product) => !unpriced.includes(product)), unpriced };
}

/** What the buyer chooses between, e.g. "Colour" or "Size / Colour". Shopify's placeholder option "Title" means no real choice. */
export function optionLabel(product: Pick<ShopifyProduct, 'options'>): string {
  const names = product.options.map((option) => option.name).filter((name) => name !== 'Title');
  return names.length > 0 ? names.join(' / ') : 'Option';
}
