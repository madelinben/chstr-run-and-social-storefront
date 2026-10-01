# Config

## Stack

| Key | Value |
|---|---|
| STACK | `astro` |
| Ship gate | `predeploy` (`check` + test + build + e2e) |
| Dev / E2E port | `4321` |
| Lovable / v0 contributors | no |
| Deploy target | Cloudflare Workers (static assets) + D1 (`DEPLOYMENT_STRATEGY.md` § 1) |

Local: repo-root `.env.local` (copy from `.env.example` via `pnpm setup`). CI needs no live secrets — placeholder values only. Production secrets live in Worker secrets and variables. Never commit secrets.

## Domains

| Env | Domain |
|---|---|
| Production | `www.chstr-run-and-social.[tld]` (TLD not yet bought/decided) |

## Server-only env

| Var | Purpose |
|---|---|
| SITE_ORIGIN | Public origin: payment success/cancel URLs at runtime, and (as a build variable) canonical URLs, OG tags and the sitemap |
| SEO_STRICT | Build variable. `1` in production: the build fails if `SITE_ORIGIN` is localhost or a placeholder (`seo.mdc`) |
| KEYSTATIC_GITHUB_CLIENT_ID / KEYSTATIC_GITHUB_CLIENT_SECRET / KEYSTATIC_SECRET | Keystatic GitHub mode (production only) |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google OAuth web client for staff sign-in |
| SESSION_SECRET | Signs the staff session and login-state cookies. `openssl rand -hex 32` |
| ADMIN_EMAILS | Comma-separated Google addresses allowed into `/admin` and `/keystatic` |
| (D1 binding `DB`) | Orders database, declared in `wrangler.toml`, not an env var |
| PAYMENT_PROVIDERS | Enabled provider ids, first is default (`stripe`). Non-secret: set in `wrangler.toml` `[vars]`. `mock,stripe` locally only |
| MOCK_PAYMENT_SECRET | Keys the `mock` provider's webhook. Local and e2e only |
| STRIPE_SECRET_KEY | Create Checkout Sessions |
| STRIPE_WEBHOOK_SECRET | Verify `checkout.session.completed` signature |
| RESEND_API_KEY | Staff order notification email |
| STAFF_NOTIFICATION_EMAIL | Where new-order pings go |

## Browser-exposed env (`PUBLIC_` only)

| Var | Purpose |
|---|---|
| PUBLIC_WAIVER_URL | Jotform waiver (`https://form.jotform.com/261512447166052`) |
| PUBLIC_WHATSAPP_NUMBER | click-to-chat on `/contact` |
| PUBLIC_INSTAGRAM_URL / PUBLIC_FACEBOOK_URL | social links |

## Runtime config

Catalogue and FAQ copy live in `src/content/`; order status lives in D1 (`.cursor/rules/database.mdc`). No hardcoded fallback catalogue. Invalid content fails the build.

## Email

Cloudflare Email Routing proxies staff addresses (`www`/`cms` domain mailboxes → staff inboxes). Order notifications go out via Resend (transactional send is not covered by Email Routing).
