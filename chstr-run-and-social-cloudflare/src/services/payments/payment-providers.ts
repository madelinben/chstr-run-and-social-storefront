import { stripeProvider } from '@/services/integrations/stripe/stripe-provider';
import { mockPaymentProvider } from '@/services/payments/mock-payment-provider';
import type { PaymentProvider } from '@/services/payments/payment-provider';
import type { ServerEnvironment } from '@/services/environment/server-environment';

/** Adding a provider = one adapter file + one line here (docs/PAYMENTS.md). */
const providers: Record<string, PaymentProvider> = {
  [stripeProvider.id]: stripeProvider,
  [mockPaymentProvider.id]: mockPaymentProvider,
};

/** Providers switched on for this deployment, in preference order. Fails on an unknown id so a typo cannot silently disable payments. */
export function enabledProviderIds(env: Pick<ServerEnvironment, 'PAYMENT_PROVIDERS'>): string[] {
  const ids = (env.PAYMENT_PROVIDERS ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) throw new Error('PAYMENT_PROVIDERS lists no provider.');
  const unknown = ids.filter((id) => !(id in providers));
  if (unknown.length > 0) throw new Error(`Unknown payment provider: ${unknown.join(', ')}.`);
  return ids;
}

/** `requested` picks one of the enabled providers; omitted means the first. Anything else is rejected. */
export function chooseProviderId(env: Pick<ServerEnvironment, 'PAYMENT_PROVIDERS'>, requested?: string): string {
  const enabled = enabledProviderIds(env);
  if (requested === undefined) return enabled[0];
  if (!enabled.includes(requested)) throw new Error(`Payment provider ${requested} is not enabled.`);
  return requested;
}

export function getPaymentProvider(id: string): PaymentProvider {
  const provider = providers[id];
  if (!provider) throw new Error(`Unknown payment provider: ${id}.`);
  return provider;
}
