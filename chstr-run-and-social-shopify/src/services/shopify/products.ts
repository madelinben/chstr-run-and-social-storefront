import * as z from 'zod/mini';
import { storefrontRequest } from '@/services/shopify/storefront-client';

const moneySchema = z.object({ amount: z.string(), currencyCode: z.string() });

const productSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  description: z.string(),
  featuredImage: z.nullable(z.object({ url: z.string(), altText: z.nullable(z.string()) })),
  images: z.object({ nodes: z.array(z.object({ url: z.string(), altText: z.nullable(z.string()) })) }),
  variants: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        availableForSale: z.boolean(),
        price: moneySchema,
      }),
    ),
  }),
});

export type ShopifyProduct = z.infer<typeof productSchema>;

const PRODUCT_FIELDS = `
  id handle title description
  featuredImage { url altText }
  images(first: 6) { nodes { url altText } }
  variants(first: 50) { nodes { id title availableForSale price { amount currencyCode } } }
`;

export async function fetchProducts(): Promise<ShopifyProduct[]> {
  const data = await storefrontRequest(
    `query Products { products(first: 100, sortKey: CREATED_AT, reverse: true) { nodes { ${PRODUCT_FIELDS} } } }`,
    {},
    z.object({ products: z.object({ nodes: z.array(productSchema) }) }),
  );
  return data.products.nodes;
}
