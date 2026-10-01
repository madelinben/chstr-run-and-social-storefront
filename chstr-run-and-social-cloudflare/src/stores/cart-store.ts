import { atom, computed } from 'nanostores';
import { MAX_LINE_QUANTITY } from '@/domain/cart/cart-total';

export interface StoredCartLine {
  productSlug: string;
  name: string;
  size: string;
  quantity: number;
  unitPricePence: number;
}

const STORAGE_KEY = 'chstr-cart-v1';

export const cartLines = atom<StoredCartLine[]>([]);
export const cartCount = computed(cartLines, (lines) => lines.reduce((sum, line) => sum + line.quantity, 0));
export const cartTotalPence = computed(cartLines, (lines) => lines.reduce((sum, line) => sum + line.unitPricePence * line.quantity, 0));

// Hand-written guard instead of zod: zod added ~24 KB gz to every page (performance.mdc).
function isStoredLine(value: unknown): value is StoredCartLine {
  if (typeof value !== 'object' || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.productSlug === 'string' &&
    typeof line.name === 'string' &&
    typeof line.size === 'string' &&
    Number.isInteger(line.quantity) && (line.quantity as number) >= 1 && (line.quantity as number) <= MAX_LINE_QUANTITY &&
    Number.isInteger(line.unitPricePence) && (line.unitPricePence as number) >= 0
  );
}

function persist(lines: StoredCartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage blocked (private window): the cart still works for this page view.
  }
}

/** Call once on the client before first use. Stored data that fails the guard is discarded. */
export function hydrateCart() {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    cartLines.set(Array.isArray(parsed) && parsed.every(isStoredLine) ? parsed : []);
  } catch {
    cartLines.set([]);
  }
}

function update(lines: StoredCartLine[]) {
  cartLines.set(lines);
  persist(lines);
}

export function addLine(line: StoredCartLine) {
  const lines = cartLines.get();
  const match = lines.find((candidate) => candidate.productSlug === line.productSlug && candidate.size === line.size);
  if (!match) return update([...lines, line]);
  update(lines.map((candidate) => (candidate === match ? { ...candidate, quantity: Math.min(MAX_LINE_QUANTITY, candidate.quantity + line.quantity) } : candidate)));
}

export function changeQuantity(productSlug: string, size: string, quantity: number) {
  const lines = cartLines.get();
  if (quantity < 1) return update(lines.filter((line) => !(line.productSlug === productSlug && line.size === size)));
  update(lines.map((line) => (line.productSlug === productSlug && line.size === size ? { ...line, quantity: Math.min(MAX_LINE_QUANTITY, quantity) } : line)));
}

export function clearCart() {
  update([]);
}
