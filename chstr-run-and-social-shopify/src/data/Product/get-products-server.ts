import { fetchProducts, type ShopifyProduct } from '@/services/shopify/products';

/**
 * Build-time read. Whatever Shopify returns is shown: free products are fine, sold-out products stay (as "Sold out"),
 * and an empty catalogue is a valid state, not an error. The shop pages render a "coming soon" message.
 */
export async function getProductsServer(): Promise<ShopifyProduct[]> {
  const products = await fetchProducts();
  if (products.length === 0) console.warn('Shopify returned no products. Publish products to the CHSTR Storefront app channel to fill the shop.');
  return products;
}
