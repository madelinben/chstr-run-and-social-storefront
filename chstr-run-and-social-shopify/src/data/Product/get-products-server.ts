import { splitSellable } from '@/data/Product/sellable-products';
import { fetchProducts, type ShopifyProduct } from '@/services/shopify/products';

/**
 * Build-time read. Products still at £0.00 are left out with a warning (finish them in Shopify admin).
 * Nothing sellable fails the build: there is no fallback catalogue (CONFIG.md).
 */
export async function getProductsServer(): Promise<ShopifyProduct[]> {
  const { sellable, unpriced } = splitSellable(await fetchProducts());
  if (unpriced.length > 0) console.warn(`Skipping ${unpriced.length} product(s) with no price set in Shopify: ${unpriced.map((product) => product.title).join(', ')}`);
  if (sellable.length === 0) {
    throw new Error('No sellable products from Shopify. Give at least one product a price above £0 and make it available to the CHSTR Storefront app channel.');
  }
  return sellable;
}
