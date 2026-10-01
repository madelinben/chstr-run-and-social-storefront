# Payments — provider seam

Stripe is the first provider, not a dependency of the order flow. Everything above `services/payments/` speaks one neutral shape; vendors live behind it.

## Flow

```
cart → POST /api/checkout { lines, provider? }
     → data/Checkout   prices from the content catalogue, picks an enabled provider
     → registry payment.createCheckout → provider.createCheckout → hosted page URL → browser redirects

provider → POST /api/payments/webhook/<provider id>
     → registry payment.readWebhook → provider.readWebhook (verifies signature, returns PaymentEvent)
     → data/Order/create-order-from-payment → D1 (idempotent on provider + reference) → staff email
```

## Where things live

| Path | Role |
|---|---|
| `services/payments/payment-provider.ts` | The `PaymentProvider` port and neutral types (`CheckoutLine`, `PaymentEvent`) |
| `services/payments/payment-providers.ts` | Provider table, `PAYMENT_PROVIDERS` parsing, default and requested selection |
| `services/payments/run-payment.ts` | Registry handlers that dispatch to the chosen provider |
| `services/integrations/<vendor>/` | One vendor's SDK and calls. Only place a vendor SDK may be imported (lint-enforced) |
| `services/integrations/registry.ts` | `payment.createCheckout`, `payment.readWebhook`; one audit line per call, provider named, no payload |
| `data/Checkout/`, `data/Order/` | Vendor-free. Never import a provider |

## Choosing providers

`PAYMENT_PROVIDERS` is a comma list, first is the default: `stripe` in production, `mock,stripe` locally. An unknown id fails loudly. A request may name any enabled provider; the checkout UI does not offer a choice yet (`provider` in the `/api/checkout` body is the hook).

Swap provider = change the variable and register the new webhook URL. Run two providers side by side = list both. Orders keep the provider that took the payment (`payment_provider`, `payment_reference`), so history survives a swap.

## Add a provider (example: `sumup`)

1. `src/services/integrations/sumup/sumup-provider.ts` exports `sumupProvider: PaymentProvider` with `id: 'sumup'`.
   - `createCheckout`: create the hosted checkout from `lines`, `successUrl`, `cancelUrl`; return `{ url }`. Amounts are pence.
   - `readWebhook`: verify the signature first (throw if bad), then map the vendor event to `PaymentEvent`. Return `{ kind: 'ignored' }` for events you do not act on. For `payment-completed`, supply every line (`productSlug`, `size`, `quantity`, `unitPricePence`); if the vendor omits them, fetch them here (Stripe does) or carry them in checkout metadata.
   - Read credentials only with `requireSetting(env.SUMUP_KEY, 'SUMUP_KEY')`.
2. Add the credential names to `ServerEnvironment` (optional fields), `.env.example`, `docs/CONFIG.md`.
3. Add one line to `providers` in `payment-providers.ts`.
4. Register `https://www.<domain>/api/payments/webhook/sumup` in the vendor dashboard.
5. Set `PAYMENT_PROVIDERS` (e.g. `sumup,stripe`). The `it.each` in `services/payments/tests/payment-providers.test.ts` covers the port; add the id to its list.
6. Test the full flow with the vendor's test mode.

## Rules the port enforces

- The server prices the cart from the content catalogue. A provider only receives priced lines.
- A webhook is trusted only after the provider verifies it. Failures return 400 and store nothing.
- Order creation is idempotent on `(payment_provider, payment_reference)`. A replayed webhook is a no-op.
- A failed staff email is logged, not thrown: the order is stored and a 5xx would only trigger useless retries.
- Hosted-redirect model only. A provider that needs an embedded form or a different confirmation step (e.g. redirect-return without a webhook) needs the port extended deliberately, not worked around.

## Limits and known gaps

- Refunds are staff-driven: set `REFUNDED` in `/admin/orders`, then refund in the vendor dashboard. No refund call is in the port yet.
- `mock` is for local and e2e only. Never list it in production.
- Currency is GBP and delivery is pickup-only; both are fixed in the checkout adapters.
