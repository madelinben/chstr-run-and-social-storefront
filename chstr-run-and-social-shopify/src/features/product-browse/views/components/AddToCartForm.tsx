import { useState } from 'react';
import { addToCart } from '@/stores/cart-store';

interface Variant {
  id: string;
  title: string;
  availableForSale: boolean;
}

interface Props {
  name: string;
  /** What the options are called in this store, e.g. "Colour". */
  optionLabel: string;
  variants: Variant[];
}

export default function AddToCartForm({ name, optionLabel, variants }: Props) {
  const firstAvailable = variants.find((variant) => variant.availableForSale) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable.id);
  const [added, setAdded] = useState(false);
  const selected = variants.find((variant) => variant.id === variantId) ?? firstAvailable;
  const hasChoice = variants.length > 1;

  async function add() {
    await addToCart(selected.id);
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
                {variant.title}{variant.availableForSale ? '' : ' (sold out)'}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        disabled={!selected.availableForSale}
        onClick={add}
        className="min-h-10 rounded-full border-4 border-border bg-accent px-5 py-2 font-display font-extrabold uppercase active:scale-[0.96] disabled:opacity-60"
      >
        {!selected.availableForSale ? 'Sold Out' : added ? 'Added ✓' : 'Add To Cart'}
      </button>
      <span role="status" className="sr-only">{added ? `${name} ${selected.title} added to your cart` : ''}</span>
    </div>
  );
}
