import Stripe from 'stripe';
import { requireSetting } from '@/services/environment/require-setting';
import type { ServerEnvironment } from '@/services/environment/server-environment';

export function createStripeClient(env: ServerEnvironment) {
  return new Stripe(requireSetting(env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY'), { httpClient: Stripe.createFetchHttpClient() });
}
