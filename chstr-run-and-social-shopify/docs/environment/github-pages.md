# GitHub Pages (MVP preview hosting)

Free hosting for showing the prototype to the customer. Production strategy stays Cloudflare (`DEPLOYMENT_STRATEGY.md`); this is the first, throwaway step.

## How it works

`../.github/workflows/deploy-shopify-pages.yml` builds this app against the **live Shopify store**, runs `check:site`, and publishes `dist/` to `https://<owner>.github.io/<repo>/`. Triggers: push to `main` touching this app, every Monday (refreshes the schema's next-session date), `repository_dispatch` type `shopify-products-changed` (for a Shopify webhook), and manual run.

| Setting | Value | Why |
|---|---|---|
| `SITE_ORIGIN` | `https://<owner>.github.io` | canonical / OG origin |
| `BASE_PATH` | `/<repo>` | project sites live under a sub-path; every internal URL goes through `withBase` (`src/utilities/with-base.ts`) |
| `PUBLIC_SITE_NOINDEX` | `1` | preview must not be indexed: `noindex` on every page, `robots.txt` `Disallow: /`, no sitemap |

Repo **variables** (not secrets; all public by design): `PUBLIC_SHOPIFY_STORE_DOMAIN`, `PUBLIC_SHOPIFY_STOREFRONT_TOKEN`, `PUBLIC_WAIVER_URL`, `PUBLIC_INSTAGRAM_URL`, `PUBLIC_FACEBOOK_URL` (optional: `PUBLIC_WHATSAPP_NUMBER`, `PUBLIC_CONTACT_EMAIL`).

## Repo variables that change the deployment

| Variable | Effect |
|---|---|
| `SITE_NOINDEX` | `1` (default) = preview, hidden from search. `0` = public. Set `0` only on the real domain |
| `SITE_ORIGIN` | e.g. `https://www.example.com`. When set, the site is built for that domain's root (no `/repo/` path) |
| `SEO_STRICT` | `1` makes the build refuse a localhost or placeholder origin |
| `PUBLIC_WHATSAPP_GROUP_URL`, `PUBLIC_WHATSAPP_NUMBER`, `PUBLIC_CONTACT_EMAIL` | contact buttons and schema, hidden until set |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console meta tag |

The full launch sequence is in `../../../docs/PREDEPLOY_CHECKLIST.md` (repo root `docs/`).

## One-time enable

1. GitHub only serves Pages from a **private** repo on a paid plan. On a free account the repo must be public.
2. Settings → Pages → Source: **GitHub Actions** (or `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`).
3. Run the workflow (Actions → Deploy Shopify site to GitHub Pages → Run workflow). Until Pages is enabled the workflow builds and checks, then skips the deploy with a warning.

## Local check of the Pages build

```bash
SITE_ORIGIN=https://<owner>.github.io BASE_PATH=/<repo> PUBLIC_SITE_NOINDEX=1 pnpm build
SITE_ORIGIN=https://<owner>.github.io BASE_PATH=/<repo> PUBLIC_SITE_NOINDEX=1 pnpm check:site
SITE_ORIGIN=... BASE_PATH=/<repo> PUBLIC_SITE_NOINDEX=1 pnpm exec astro preview --port 4330
```

## Limits

- New products appear on the next build, not instantly. Point a Shopify webhook (products create/update/delete) at a small relay that sends `repository_dispatch` `shopify-products-changed`, or just re-run the workflow.
- Cart and checkout are Shopify's (hosted checkout); GitHub Pages only serves the static pages.
- No custom headers or redirects on Pages: security headers and an apex→`www` redirect come with Cloudflare later.
