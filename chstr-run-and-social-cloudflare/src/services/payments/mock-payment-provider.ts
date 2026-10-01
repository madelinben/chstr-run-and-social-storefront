import { z } from 'zod';
import type { PaymentProvider } from '@/services/payments/payment-provider';

const webhookSchema = z.object({
  reference: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().nullable().default(null),
  lines: z.array(z.object({ productSlug: z.string(), size: z.string(), quantity: z.number().int().min(1), unitPricePence: z.number().int().nonnegative() })).min(1),
});

/** Local and e2e only: skips the hosted page and lets a test post a signed "payment completed" webhook. Never list it in production. */
export const mockPaymentProvider: PaymentProvider = {
  id: 'mock',
  async createCheckout(input) {
    return { url: input.successUrl };
  },
  async readWebhook(input, env) {
    if (!env.MOCK_PAYMENT_SECRET || input.headers.get('x-mock-secret') !== env.MOCK_PAYMENT_SECRET) {
      throw new Error('Mock payment secret does not match.');
    }
    const parsed = webhookSchema.parse(JSON.parse(input.body));
    return { kind: 'payment-completed', ...parsed };
  },
};
