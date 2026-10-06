# Deployment strategy

Production shipping. Local dev: [SETUP.md](./SETUP.md).

## 0. MVP preview: GitHub Pages

First customer-facing prototype runs on free GitHub Pages as a noindex preview, built against the live Shopify store. Mechanics and one-time enable: `environment/github-pages.md`. The Cloudflare strategy below is the production plan.

## 1. Strategy (locked at intake)

**Static host: Cloudflare Pages.** The site is fully static; Shopify provides commerce, checkout and order handling, so there is no server, database or secret to host. Cost: Pages free tier plus the Shopify plan. Gives up: nothing custom can run server-side — a future need (custom webhook, admin tool) would add Pages Functions.

Owner approving first production deploy: club organiser (name to be recorded here).

## 2. Production requirements

Cloudflare mechanics: `environment/cloudflare.md`. Shopify: `environment/shopify.md`.

- [ ] Cloudflare Pages project linked to GitHub repo, production branch `main`
- [ ] Build command `pnpm build`, output `dist`, Node 22
- [ ] `PUBLIC_SHOPIFY_*` set per environment in Pages
- [ ] Storefront token created with only the read-product and cart/checkout scopes
- [ ] Deploy hook created; triggered on a schedule or manually when products are added
- [ ] Shopify local pickup + “ready for pickup” notification configured

## 3. Environments

`local` → `preview` (every PR, Pages preview URL) → `production`. Local and preview use a Shopify development store token; production uses the live store token.

## 4. Branch and PR rules

`main` is the only long-lived branch. PR body from `.github/pull_request_template.md` (`pull-requests.mdc`).

## 5. Pipeline checks

`pnpm predeploy`: branch-base → typecheck → lint → test → build → e2e (`predeploy.mdc`).

## 6. Rollback

- **Code** — revert merge commit or promote the previous Cloudflare deployment.
- **Data** — nothing stored in this repo. Orders and products live in Shopify (use its export for backup). FAQ content restores via git revert.

## 7. Search and speed gates

- [ ] `SITE_ORIGIN` set to the production origin and `SEO_STRICT=1` on the production build (build fails on a placeholder origin)
- [ ] `pnpm check:site` green: metadata, Open Graph, schema.org, sitemap, links, bundle budgets (`seo.mdc`, `performance.mdc`)
- [ ] Rebuild at least weekly (scheduled deploy): the home page's Event `startDate` is the next Monday computed at build time
- [ ] After launch: submit `/sitemap-index.xml` in Google Search Console, check Rich Results Test on `/` and a product page, watch Core Web Vitals field data
