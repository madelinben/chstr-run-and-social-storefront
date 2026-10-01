import { chooseProviderId, getPaymentProvider } from '@/services/payments/payment-providers';
import type { CheckoutLine, PaymentEvent } from '@/services/payments/payment-provider';
import type { ServerEnvironment } from '@/services/environment/server-environment';

export async function createCheckout(
  input: { providerId: string; lines: CheckoutLine[]; successUrl: string; cancelUrl: string },
  env: ServerEnvironment,
): Promise<{ url: string }> {
  const { providerId, ...checkout } = input;
  return getPaymentProvider(chooseProviderId(env, providerId)).createCheckout(checkout, env);
}

export async function readWebhook(input: { providerId: string; body: string; headers: Headers }, env: ServerEnvironment): Promise<PaymentEvent> {
  const { providerId, ...webhook } = input;
  return getPaymentProvider(chooseProviderId(env, providerId)).readWebhook(webhook, env);
}
