import type { APIRoute } from 'astro';
import { createOrderFromPayment } from '@/data/Order/create-order-from-payment';
import { runOperation } from '@/services/integrations/registry';
import { getServerEnvironment } from '@/services/environment/server-environment';

export const prerender = false;

/** One endpoint shape for every provider: /api/payments/webhook/<provider id>. Each provider verifies its own signature. */
export const POST: APIRoute = async ({ request, params }) => {
  const env = getServerEnvironment();
  const providerId = params.provider ?? '';
  const event = await runOperation('payment.readWebhook', { providerId, body: await request.text(), headers: request.headers }, env).catch(() => null);
  if (!event) return new Response('Rejected', { status: 400 });
  if (event.kind === 'payment-completed') await createOrderFromPayment(providerId, event, env);
  return new Response('ok');
};
