import { useState } from 'react';
import { addToCart } from '@/stores/cart-store';
import { formatMoney } from '@/utilities/format-money';

interface Variant {
  id: string;
  title: string;
  availableForSale: boolean;
  /** Decimal string, e.g. "22.0". */
  price: string;
}

interface Props {
  name: string;
  /** What the options are called in this store, e.g. "Colour". */
  optionLabel: string;
  variants: Variant[];
  /** Each choice shows its own price when sizes or colours are priced differently. */
  showVariantPrices?: boolean;
}

export default function AddToCartForm({ name, optionLabel, variants, showVariantPrices = false }: Props) {
  const firstAvailable = variants.find((variant) => variant.availableForSale) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? '');
  const [added, setAdded] = useState(false);
  const selected = variants.find((variant) => variant.id === variantId) ?? firstAvailable;
  const hasChoice = variants.length > 1;

  // A product with no variants cannot be bought: render nothing rather than a dead button.
  if (!selected) return null;
  const selectedId = selected.id;

  async function add() {
    await addToCart(selectedId);
    setAdded(true);
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {hasChoice && (
        <label className="flex items-center gap-2 font-bold">
          {optionLabel}
          <select value={variantId} onChange={(event) => { setVariantId(event.target.value); setAdded(false); }} className="min-h-10 rounded-full border-4 border-border bg-card px-3">
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={!variant.availableForSale}>
                {variant.title}{showVariantPrices ? ` – ${formatMoney(variant.price)}` : ''}{variant.availableForSale ? '' : ' (sold out)'}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        disabled={!selected.availableForSale}
        onClick={add}
        className="min-h-10 rounded-full border-4 border-border bg-accent px-5 py-2 font-display font-extrabold uppercase press disabled:opacity-60"
      >
        {!selected.availableForSale ? 'Sold Out' : added ? 'Added ✓' : 'Add To Cart'}
      </button>
      <span role="status" className="sr-only">{added ? `${name} ${selected.title} added to your cart` : ''}</span>
    </div>
  );
}
