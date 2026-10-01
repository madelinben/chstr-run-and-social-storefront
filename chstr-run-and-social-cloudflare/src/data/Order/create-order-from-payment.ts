import { insertOrder } from '@/data/Order/order-dal';
import { runOperation } from '@/services/integrations/registry';
import type { PaymentEvent } from '@/services/payments/payment-provider';
import type { ServerEnvironment } from '@/services/environment/server-environment';

type CompletedPayment = Extract<PaymentEvent, { kind: 'payment-completed' }>;

/**
 * Idempotent on (provider, reference), so a replayed webhook stores nothing. Notifies staff only for a newly stored order.
 * A failed notification is logged, not thrown: the order is stored, and a 5xx would make the provider retry for nothing.
 */
export async function createOrderFromPayment(providerId: string, payment: CompletedPayment, env: ServerEnvironment) {
  const orderId = await insertOrder(
    env.DB,
    { paymentProvider: providerId, paymentReference: payment.reference, customerEmail: payment.email, customerPhone: payment.phone, lines: payment.lines },
    new Date().toISOString(),
  );
  if (orderId === null) return { created: false };

  const summary = payment.lines.map((line) => `${line.quantity} x ${line.productSlug} (${line.size})`).join('\n');
  try {
    await runOperation(
      'resend.notifyStaff',
      { subject: `New merchandise order ${orderId}`, text: `Order ${orderId} is paid and waiting to be ordered from the supplier.\n\n${summary}\n\nCustomer: ${payment.email}` },
      env,
    );
  } catch (error) {
    console.error(`Order ${orderId} stored but staff notification failed.`, error);
  }
  return { created: true };
}
