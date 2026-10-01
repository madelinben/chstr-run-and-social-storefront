import { fetchProducts, type ShopifyProduct } from '@/services/shopify/products';

/** Build-time read. An empty catalogue fails the build: no fallback catalogue (CONFIG.md). */
export async function getProductsServer(): Promise<ShopifyProduct[]> {
  const products = await fetchProducts();
  if (products.length === 0) throw new Error('Shopify returned no products. Publish at least one to the Headless channel.');
  return products;
}
