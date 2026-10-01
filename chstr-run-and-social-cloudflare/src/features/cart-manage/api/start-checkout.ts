import type { StoredCartLine } from '@/stores/cart-store';

/** Returns the provider's hosted checkout address, or a human message to show. */
export async function startCheckout(lines: StoredCartLine[]): Promise<{ url: string } | { message: string }> {
  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: lines.map(({ productSlug, size, quantity }) => ({ productSlug, size, quantity })) }),
    });
    const body: unknown = await response.json();
    // Hand-checked, not zod: keeps zod out of the browser bundle (performance.mdc).
    if (typeof body === 'object' && body !== null) {
      const { url, message } = body as { url?: unknown; message?: unknown };
      if (typeof url === 'string' && url.startsWith('https://')) return { url };
      if (typeof message === 'string') return { message };
    }
  } catch {
    // fall through to the generic message
  }
  return { message: 'We could not start checkout. Your cart is saved. Try again, or contact us.' };
}
