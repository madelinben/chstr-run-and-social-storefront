import { useState } from 'react';
import { addLine, hydrateCart } from '@/stores/cart-store';

interface Props {
  productSlug: string;
  name: string;
  unitPricePence: number;
  sizes: readonly string[];
}

export default function AddToCartForm({ productSlug, name, unitPricePence, sizes }: Props) {
  const [size, setSize] = useState(sizes[0]);
  const [added, setAdded] = useState(false);

  function add() {
    hydrateCart();
    addLine({ productSlug, name, size, quantity: 1, unitPricePence });
    setAdded(true);
    window.dispatchEvent(new Event('cart-updated'));
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 font-bold">
        Size
        <select value={size} onChange={(event) => { setSize(event.target.value); setAdded(false); }} className="min-h-10 rounded-full border-4 border-border bg-card px-3">
          {sizes.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <button type="button" onClick={add} className="min-h-10 rounded-full border-4 border-border bg-accent px-5 py-2 font-display font-extrabold uppercase active:scale-[0.96]">
        {added ? 'Added ✓' : 'Add To Cart'}
      </button>
      <span role="status" className="sr-only">{added ? `${name} size ${size} added to your cart` : ''}</span>
    </div>
  );
}
