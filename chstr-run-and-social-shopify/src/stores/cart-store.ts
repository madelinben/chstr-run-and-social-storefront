import { atom } from 'nanostores';
import { addCartLine, createCart, fetchCart, removeCartLine, updateCartLine, type ShopifyCart } from '@/services/shopify/cart';

const STORAGE_KEY = 'chstr-cart-id';

export const cart = atom<ShopifyCart | null>(null);
export const cartError = atom('');

function readId() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function remember(next: ShopifyCart | null) {
  cart.set(next);
  try {
    if (next) localStorage.setItem(STORAGE_KEY, next.id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private window): the cart works for this page view only.
  }
}

async function run(action: () => Promise<ShopifyCart | null>) {
  cartError.set('');
  try {
    remember(await action());
  } catch {
    cartError.set('We could not update your cart. Try again, or contact us.');
  }
}

/** Call once on the client. Refetches so price and stock are live. */
export function hydrateCart() {
  const id = readId();
  if (id) void run(() => fetchCart(id));
}

export function addToCart(variantId: string) {
  const current = cart.get();
  return run(() => (current ? addCartLine(current.id, variantId) : createCart(variantId)));
}

export function changeLine(lineId: string, quantity: number) {
  const current = cart.get();
  if (!current) return Promise.resolve();
  return run(() => (quantity < 1 ? removeCartLine(current.id, lineId) : updateCartLine(current.id, lineId, quantity)));
}

export function clearCart() {
  remember(null);
}
