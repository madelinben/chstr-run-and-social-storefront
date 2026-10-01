import { getCollection } from 'astro:content';
import { plainText } from '@/utilities/plain-text';
import type { CatalogueProduct } from '@/domain/cart/cart-total';

export interface ProductView extends CatalogueProduct {
  slug: string;
  images: string[];
  description: string;
}

export async function getProductsServer(): Promise<ProductView[]> {
  const entries = await getCollection('products', ({ data }) => data.published);
  return entries.map((entry) => ({
    slug: entry.id,
    name: entry.data.name,
    pricePence: entry.data.pricePence,
    sizes: entry.data.sizes,
    images: entry.data.images,
    description: plainText(entry.body ?? '') || `Collect the ${entry.data.name} at a Monday run.`,
  }));
}

export async function getCatalogueServer(): Promise<Map<string, CatalogueProduct>> {
  const products = await getProductsServer();
  return new Map(products.map((product) => [product.slug, product]));
}
