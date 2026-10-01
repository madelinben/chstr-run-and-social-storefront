# Context — ubiquitous language

One row per domain noun, one spelling. Every doc, rule, identifier and UI label reuses it (`naming.mdc`).

| Term | Meaning |
|---|---|
| Session | The weekly CHSTR run and social: Mondays 18:30 at The Architect, always free. Not “event”. |
| Waiver | The form a new runner signs before their first session. Hosted on Jotform, linked from `/waiver`. |
| Product | A merchandise item staff publish as a content entry, with sizes and a price. Not “item” or “merch”. |
| Basket | The visitor’s chosen products and sizes, held in browser `localStorage`. Not “cart”. |
| Payment provider | A vendor that takes payment through a hosted page and confirms it by webhook (Stripe first). One neutral port: `docs/PAYMENTS.md`. |
| Order | One confirmed payment, stored as a row in the D1 `orders` table keyed by provider and payment reference. |
| Order status | One of `PAID_UNFULFILLED`, `ORDERED_FROM_SUPPLIER`, `READY_FOR_PICKUP`, `FULFILLED`, `REFUNDED` (`domain/order/order-status.ts`). |
| Pickup | Customer collects an order at the next session. No delivery. |
| Staff | Club organisers who manage products in the Keystatic editor and orders in `/admin/orders`. |
