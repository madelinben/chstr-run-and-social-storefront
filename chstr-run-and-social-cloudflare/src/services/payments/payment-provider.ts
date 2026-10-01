import type { ServerEnvironment } from '@/services/environment/server-environment';

export interface CheckoutLine {
  productSlug: string;
  size: string;
  quantity: number;
  name: string;
  unitPricePence: number;
}

export interface PaidLine {
  productSlug: string;
  size: string;
  quantity: number;
  unitPricePence: number;
}

/** What every provider's webhook is translated into. The order layer never sees a vendor shape. */
export type PaymentEvent =
  | { kind: 'payment-completed'; reference: string; email: string; phone: string | null; lines: PaidLine[] }
  | { kind: 'ignored' };

/**
 * The port every payment provider implements (docs/PAYMENTS.md).
 * Hosted-checkout redirect model: createCheckout returns a URL, the webhook confirms payment.
 */
export interface PaymentProvider {
  readonly id: string;
  createCheckout(input: { lines: CheckoutLine[]; successUrl: string; cancelUrl: string }, env: ServerEnvironment): Promise<{ url: string }>;
  /** Verify the request is genuine, then translate it. Throws on a bad signature. Must return `ignored` for events it does not act on. */
  readWebhook(input: { body: string; headers: Headers }, env: ServerEnvironment): Promise<PaymentEvent>;
}
