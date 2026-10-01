# Config

## Stack

| Key | Value |
|---|---|
| STACK | `astro` |
| Ship gate | `predeploy` (`check` + test + build + e2e) |
| Dev / E2E port | `4321` |
| Lovable / v0 contributors | no |
| Deploy target | Cloudflare Pages, static only (`DEPLOYMENT_STRATEGY.md` § 1) |
| Commerce backend | Shopify (Storefront API + hosted checkout) |

Local: repo-root `.env.local` (copy from `.env.example` via `pnpm setup`). Never commit secrets — this project has none: every var is `PUBLIC_`.

## Domains

| Env | Domain |
|---|---|
| Production | `www.chstr-run-and-social.[tld]` (TLD not yet decided) |
| Shopify checkout | Shopify-hosted (`*.myshopify.com`, or a custom checkout domain later) |

## Env (all browser-exposed)

| Var | Purpose |
|---|---|
| PUBLIC_SHOPIFY_STORE_DOMAIN | `your-store.myshopify.com` |
| PUBLIC_SHOPIFY_STOREFRONT_TOKEN | Storefront API **public** access token (read products, manage cart). Admin tokens never enter this repo. |
| PUBLIC_WAIVER_URL | Jotform waiver (`https://form.jotform.com/261512447166052`) |
| PUBLIC_WHATSAPP_NUMBER | click-to-chat on `/contact` |
| PUBLIC_INSTAGRAM_URL / PUBLIC_FACEBOOK_URL | social links |

CI does not use a real store: it builds against `scripts/mock-storefront.mjs` (`PUBLIC_SHOPIFY_STOREFRONT_URL`). Production and preview deploys build against the live Storefront API with the two vars above.

## Build variables (SEO)

| Var | Purpose |
|---|---|
| SITE_ORIGIN | Production origin (`https://www.<domain>`): canonical URLs, OG tags, sitemap. Default `http://localhost:4321` |
| SEO_STRICT | `1` in production builds: fails if `SITE_ORIGIN` is localhost or a placeholder (`seo.mdc`) |

## Runtime config

Catalogue, prices, variants and stock live in Shopify. FAQ copy lives in `src/content/faqs/`. No hardcoded fallback catalogue: an empty or failing Storefront response fails the build.

## Email

Cloudflare Email Routing proxies staff mailboxes. Order emails (confirmation, new-order, pickup-ready) are Shopify notifications, configured in Shopify admin.
