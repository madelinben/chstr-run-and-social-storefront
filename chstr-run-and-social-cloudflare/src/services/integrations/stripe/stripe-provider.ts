import { createCheckoutSession } from '@/services/integrations/stripe/create-checkout-session';
import { getSessionLines } from '@/services/integrations/stripe/get-session-lines';
import { verifyWebhookEvent } from '@/services/integrations/stripe/verify-webhook-event';
import type { PaymentProvider } from '@/services/payments/payment-provider';

export const stripeProvider: PaymentProvider = {
  id: 'stripe',
  createCheckout: createCheckoutSession,
  async readWebhook(input, env) {
    const signature = input.headers.get('stripe-signature');
    if (!signature) throw new Error('Missing Stripe signature.');
    const outcome = await verifyWebhookEvent({ body: input.body, signature }, env);
    if (outcome.kind === 'ignored') return outcome;
    const lines = await getSessionLines({ sessionId: outcome.sessionId }, env);
    return { kind: 'payment-completed', reference: outcome.sessionId, email: outcome.email, phone: outcome.phone, lines };
  },
};
