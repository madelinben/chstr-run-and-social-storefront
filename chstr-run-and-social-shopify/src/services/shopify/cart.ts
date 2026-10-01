import * as z from 'zod/mini';
import { storefrontRequest } from '@/services/shopify/storefront-client';

const cartSchema = z.object({
  id: z.string(),
  checkoutUrl: z.string(),
  totalQuantity: z.int(),
  cost: z.object({ totalAmount: z.object({ amount: z.string(), currencyCode: z.string() }) }),
  lines: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        quantity: z.int(),
        merchandise: z.object({
          id: z.string(),
          title: z.string(),
          product: z.object({ title: z.string(), handle: z.string() }),
        }),
      }),
    ),
  }),
});

export type ShopifyCart = z.infer<typeof cartSchema>;

const CART_FIELDS = `
  id checkoutUrl totalQuantity
  cost { totalAmount { amount currencyCode } }
  lines(first: 50) { nodes { id quantity merchandise { ... on ProductVariant { id title product { title handle } } } } }
`;

const mutationResult = (key: string) => z.object({ [key]: z.object({ cart: z.nullable(cartSchema) }) });

export async function createCart(variantId: string): Promise<ShopifyCart> {
  const data = await storefrontRequest(
    `mutation CartCreate($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { ${CART_FIELDS} } } }`,
    { lines: [{ merchandiseId: variantId, quantity: 1 }] },
    mutationResult('cartCreate'),
  );
  if (!data.cartCreate.cart) throw new Error('Shopify did not create a cart.');
  return data.cartCreate.cart;
}

/** Returns null when Shopify no longer knows the cart (expired or already checked out). */
export async function fetchCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await storefrontRequest(
    `query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
    { id: cartId },
    z.object({ cart: z.nullable(cartSchema) }),
  );
  return data.cart;
}

export async function addCartLine(cartId: string, variantId: string): Promise<ShopifyCart | null> {
  const data = await storefrontRequest(
    `mutation CartAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } } }`,
    { cartId, lines: [{ merchandiseId: variantId, quantity: 1 }] },
    mutationResult('cartLinesAdd'),
  );
  return data.cartLinesAdd.cart;
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<ShopifyCart | null> {
  const data = await storefrontRequest(
    `mutation CartUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } } }`,
    { cartId, lines: [{ id: lineId, quantity }] },
    mutationResult('cartLinesUpdate'),
  );
  return data.cartLinesUpdate.cart;
}

export async function removeCartLine(cartId: string, lineId: string): Promise<ShopifyCart | null> {
  const data = await storefrontRequest(
    `mutation CartRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } } }`,
    { cartId, lineIds: [lineId] },
    mutationResult('cartLinesRemove'),
  );
  return data.cartLinesRemove.cart;
}
