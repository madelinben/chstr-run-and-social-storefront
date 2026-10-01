import { createStripeClient } from '@/services/integrations/stripe/stripe-client';
import type { ServerEnvironment } from '@/services/environment/server-environment';

export interface SessionLine {
  productSlug: string;
  size: string;
  quantity: number;
  unitPricePence: number;
}

export async function getSessionLines(input: { sessionId: string }, env: ServerEnvironment): Promise<SessionLine[]> {
  const stripe = createStripeClient(env);
  const items = await stripe.checkout.sessions.listLineItems(input.sessionId, {
    limit: 100,
    expand: ['data.price.product'],
  });
  return items.data.map((item) => {
    const product = item.price?.product;
    if (!product || typeof product === 'string' || product.deleted) throw new Error('Line item product is unavailable.');
    const { productSlug, size } = product.metadata;
    if (!productSlug || !size || !item.quantity || item.price?.unit_amount == null) {
      throw new Error('Line item is missing product slug, size, quantity or price.');
    }
    return { productSlug, size, quantity: item.quantity, unitPricePence: item.price.unit_amount };
  });
}
