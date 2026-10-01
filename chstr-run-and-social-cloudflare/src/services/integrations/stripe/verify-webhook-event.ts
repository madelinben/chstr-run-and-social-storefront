import Stripe from 'stripe';
import { createStripeClient } from '@/services/integrations/stripe/stripe-client';
import { requireSetting } from '@/services/environment/require-setting';
import type { ServerEnvironment } from '@/services/environment/server-environment';

export type WebhookOutcome =
  | { kind: 'session-completed'; sessionId: string; email: string; phone: string | null }
  | { kind: 'ignored' };

export async function verifyWebhookEvent(input: { body: string; signature: string }, env: ServerEnvironment): Promise<WebhookOutcome> {
  const stripe = createStripeClient(env);
  const event = await stripe.webhooks.constructEventAsync(
    input.body,
    input.signature,
    requireSetting(env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET'),
    undefined,
    Stripe.createSubtleCryptoProvider(),
  );
  if (event.type !== 'checkout.session.completed') return { kind: 'ignored' };

  const session = event.data.object;
  if (session.payment_status !== 'paid') return { kind: 'ignored' };
  const email = session.customer_details?.email;
  if (!email) throw new Error('Paid session has no customer email.');
  return {
    kind: 'session-completed',
    sessionId: session.id,
    email,
    phone: session.customer_details?.phone ?? null,
  };
}
