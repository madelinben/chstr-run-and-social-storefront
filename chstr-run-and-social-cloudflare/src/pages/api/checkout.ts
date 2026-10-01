import type { APIRoute } from 'astro';
import { checkoutRequestSchema } from '@/data/Checkout/checkout-request-schema';
import { createCheckoutSession } from '@/data/Checkout/create-checkout-session';
import { getServerEnvironment } from '@/services/environment/server-environment';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: 'Your cart could not be read. Reload the page and try again.' }, { status: 400 });
  try {
    const { url } = await createCheckoutSession(parsed.data, getServerEnvironment());
    return Response.json({ url });
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'We could not start checkout. Your cart is saved. Try again, or contact us.' }, { status: 502 });
  }
};
