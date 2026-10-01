# Architecture

System design index. Local run: [SETUP.md](./SETUP.md). Shipping: [DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md). Law lives in `../.cursor/rules/*.mdc`; this file points, does not repeat.

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro (static output) + React islands |
| Language | TypeScript strict, no `any` |
| Content | Astro content collections (`src/content/`) + Keystatic editor |
| DB | Cloudflare D1 (orders only) |
| Validation | Zod |
| Styling | Tailwind CSS v4 + tailwind-merge + tailwind-variants |
| Animation | CSS transitions + `IntersectionObserver` |
| Client state | Nano Stores (basket, `localStorage`) |
| Payments | Stripe Checkout Sessions + webhook |
| Email | Cloudflare Email Routing (inbound), Resend (order notifications) |
| Hosting | Cloudflare Workers + static assets |
| Testing | Vitest (unit), Playwright (e2e) |

## Repo layout

Single app at this folder's root (the git root is one level up), code under `src/` (alias `@/`). Rules: `project-structure.mdc`, `layers.mdc`.

| Path | Role |
|---|---|
| `src/pages/` | Routes, thin. `api/` = checkout + Stripe webhook |
| `src/features/<entity>-<objective>/` | Visitor jobs |
| `src/data/<Entity>/{dto,dal}` | Transform + CMS/Stripe calls |
| `src/domain/<entity>/` | Order status, basket totals |
| `src/services/integrations/` | Closed operation registry (Stripe, Resend); `services/db` wraps D1 |
| `src/stores/` | Client stores |
| `src/utilities/` | Pure helpers |

```
page → feature, data, domain, services
data → domain, services
domain → utilities (NOT data, NOT services)
services → utilities
```

## Features

| Folder | Job |
|---|---|
| `site-shell` | Nav, footer, `PanelDivider`, scroll reveals |
| `session-overview` | Hero gallery + when/where/free |
| `faq-browse` | Accordion |
| `order-manage` | Staff list + status change at `/admin/orders` (Google sign-in, `AUTH.md`) |
| `waiver-sign` | Link/embed Jotform |
| `contact-hub` | mailto, WhatsApp, Instagram, Facebook |
| `product-browse` | Product list/detail from content collections |
| `basket-manage` | Add, size, remove; `localStorage` |
| `order-checkout` | Start Stripe Checkout |

## Domains

```
domain/order/    ← order status values + allowed transitions
domain/basket/   ← basket line + total rules, no I/O
```

## Merchandise request trace

`POST /api/checkout`:

1. **page** — `src/pages/api/checkout.ts` parses the body with the checkout Zod model, returns the Stripe URL.
2. **data** — `createCheckoutSession` re-reads product prices from the content collection (never trusts client prices).
3. **domain** — basket total computed by a pure function.
4. **services** — registry operation `stripe.createCheckoutSession`.

`POST /api/payments/webhook/<provider>`: registry `payment.readWebhook` (provider verifies signature) → `createOrderFromPayment` (idempotent on provider + reference) → `services/db` `orders` + `order_lines` batch insert → registry `resend.notifyStaff`. Provider seam: `PAYMENTS.md`.

## Not applicable (by design)

Module-ownership table (one journey), shared packages, background-jobs queue (webhook + email are request-scoped), user auth (Stripe holds identity), a second database (D1 holds orders only).
