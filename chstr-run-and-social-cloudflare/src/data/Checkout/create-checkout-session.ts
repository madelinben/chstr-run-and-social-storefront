import { priceCart } from '@/domain/cart/cart-total';
import { getCatalogueServer } from '@/data/Product/get-products-server';
import { runOperation } from '@/services/integrations/registry';
import { chooseProviderId } from '@/services/payments/payment-providers';
import type { CheckoutRequest } from '@/data/Checkout/checkout-request-schema';
import type { ServerEnvironment } from '@/services/environment/server-environment';

/** Prices always come from the content catalogue, never from the browser. */
export async function createCheckoutSession(request: CheckoutRequest, env: ServerEnvironment) {
  const { lines } = priceCart(request.lines, await getCatalogueServer());
  return runOperation(
    'payment.createCheckout',
    {
      providerId: chooseProviderId(env, request.provider),
      lines,
      successUrl: `${env.SITE_ORIGIN}/merchandise/thanks/`,
      cancelUrl: `${env.SITE_ORIGIN}/merchandise/`,
    },
    env,
  );
}
