# Cloudflare data: D1 + content + admin

Loaded for the Cloudflare data layer. Generic gates: `predeploy.mdc`.

## D1 (orders)

```bash
pnpm exec wrangler d1 create chstr-orders      # copy database_id into wrangler.toml
pnpm db:migrate:local                          # local SQLite
pnpm db:migrate                                # production
```

Schema: `migrations/0001_orders.sql`. Binding `DB` available in API routes via `locals.runtime.env.DB`. Backups: `wrangler d1 export` (schedule it, or use D1 Time Travel).

## Content (products + FAQs)

- Collections: `src/content/products/`, `src/content/faqs/`; schemas in `src/content.config.ts`.
- Staff UI: Keystatic at `/keystatic`. Dev = local file mode; production = GitHub mode (needs a GitHub OAuth app + `KEYSTATIC_*` secrets). Verify Keystatic works on the Cloudflare adapter during the prototype; fallback is Decap CMS.
- A saved change commits to `main` → Pages rebuilds.

## Admin (order status)

- Route `/admin/orders`, server-rendered, **protected by Google sign-in** (`middleware.ts`, allow-list `ADMIN_EMAILS`; full flow and setup in `../AUTH.md`).
- Staff job: list orders, filter by status, move status forward. Status moves go through `domain/order/`.
- New `PAID_UNFULFILLED` order → Resend email to `STAFF_NOTIFICATION_EMAIL`.

## Free-tier limits to watch

D1 and Pages Functions free quotas are far above a club shop. Resend free tier caps daily sends. Zero Trust free covers up to 50 users.
