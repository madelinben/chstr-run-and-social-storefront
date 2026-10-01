import { createStripeClient } from '@/services/integrations/stripe/stripe-client';
import type { CheckoutLine } from '@/services/payments/payment-provider';
import type { ServerEnvironment } from '@/services/environment/server-environment';

export async function createCheckoutSession(input: { lines: CheckoutLine[]; successUrl: string; cancelUrl: string }, env: ServerEnvironment) {
  const stripe = createStripeClient(env);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    locale: 'en-GB',
    phone_number_collection: { enabled: true },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    line_items: input.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: 'gbp',
        unit_amount: line.unitPricePence,
        product_data: {
          name: `${line.name} (${line.size})`,
          metadata: { productSlug: line.productSlug, size: line.size },
        },
      },
    })),
  });
  if (!session.url) throw new Error('Stripe returned no checkout address.');
  return { url: session.url };
}
