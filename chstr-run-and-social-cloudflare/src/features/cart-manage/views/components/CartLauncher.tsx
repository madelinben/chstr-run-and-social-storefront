import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartCount, cartLines, cartTotalPence, changeQuantity, hydrateCart } from '@/stores/cart-store';
import { startCheckout } from '@/features/cart-manage/api/start-checkout';
import { formatPounds } from '@/utilities/format-pounds';

export default function CartLauncher() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lines = useStore(cartLines);
  const count = useStore(cartCount);
  const totalPence = useStore(cartTotalPence);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(hydrateCart, []);

  async function goToCheckout() {
    setPending(true);
    setMessage('');
    const result = await startCheckout(lines);
    if ('url' in result) return window.location.assign(result.url);
    setMessage(result.message);
    setPending(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="min-h-10 rounded-full border-4 border-border bg-accent px-4 py-2 font-display font-extrabold uppercase active:scale-[0.96]"
      >
        Cart <span className="tabular-nums">({count})</span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="cart-title"
        className="m-auto w-[min(32rem,92vw)] rounded-3xl border-4 border-border bg-card p-6 text-foreground backdrop:bg-foreground/60"
        onClick={(event) => event.target === dialogRef.current && dialogRef.current.close()}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="cart-title" className="text-3xl">Your Cart</h2>
          <button type="button" onClick={() => dialogRef.current?.close()} className="min-h-10 rounded-full border-4 border-border px-4 font-bold">Close</button>
        </div>
        {lines.length === 0 ? (
          <p className="mt-6">Your cart is empty. <a className="underline" href="/merchandise/">Browse the merchandise</a>.</p>
        ) : (
          <>
            <ul className="mt-6 flex flex-col gap-4">
              {lines.map((line) => (
                <li key={`${line.productSlug}-${line.size}`} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 break-words font-bold">{line.name} <span className="font-normal">({line.size})</span></span>
                  <span className="flex shrink-0 items-center gap-2">
                    <button type="button" aria-label={`Remove one ${line.name} size ${line.size}`} onClick={() => changeQuantity(line.productSlug, line.size, line.quantity - 1)} className="size-10 rounded-full border-4 border-border font-bold">−</button>
                    <span className="w-6 text-center tabular-nums">{line.quantity}</span>
                    <button type="button" aria-label={`Add one ${line.name} size ${line.size}`} onClick={() => changeQuantity(line.productSlug, line.size, line.quantity + 1)} className="size-10 rounded-full border-4 border-border font-bold">+</button>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex justify-between font-display text-xl font-extrabold">
              <span>Total</span>
              <span className="tabular-nums">{formatPounds(totalPence)}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Collect your order at a Monday run. No delivery.</p>
            {message && <p role="alert" className="mt-4 rounded-2xl bg-destructive/10 p-3">{message}</p>}
            <button
              type="button"
              disabled={pending}
              onClick={goToCheckout}
              className="mt-6 min-h-10 w-full rounded-full border-4 border-border bg-accent px-6 py-3 font-display text-lg font-extrabold uppercase active:scale-[0.96] disabled:opacity-60"
            >
              {pending ? 'Opening Checkout…' : 'Go To Checkout'}
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
