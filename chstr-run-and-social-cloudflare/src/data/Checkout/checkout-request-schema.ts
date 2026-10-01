import { z } from 'zod';
import { MAX_LINE_QUANTITY } from '@/domain/cart/cart-total';

export const checkoutRequestSchema = z.object({
  /** One of the enabled providers (PAYMENT_PROVIDERS); omitted means the default. */
  provider: z.string().min(1).optional(),
  lines: z
    .array(
      z.object({
        productSlug: z.string().min(1),
        size: z.string().min(1),
        quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
      }),
    )
    .min(1)
    .max(20),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
