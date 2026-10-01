# Deployment strategy

Production shipping. Local dev: [SETUP.md](./SETUP.md).

## 1. Strategy (locked at intake)

**Serverless platform: Cloudflare Workers with static assets** (`@astrojs/cloudflare` v14 targets Workers; the adapter rejects a Pages config). Static pages are served as assets; the API routes, `/admin` and `/keystatic` run in the Worker. Chosen for near-zero running cost, free DNS/Email Routing on the same account, and no always-on process. Gives up: long-running workers (none needed — webhook + email are request-scoped).

Everything runs on Cloudflare: Workers (site + API + admin), D1 (orders), Google OIDC (staff login, `AUTH.md`). No separate CMS server.

Owner approving first production deploy: club organiser (name to be recorded here).

## 2. Production requirements

Cloudflare mechanics: `environment/cloudflare.md`. D1, content, admin: `environment/cloudflare-data.md`.

- [ ] Worker deployed with Workers Builds linked to the GitHub repo (production branch `main`): build `pnpm build`, deploy `pnpm exec wrangler deploy`, Node 22
- [ ] Secrets set with `wrangler secret put` (or the dashboard) per environment, never in git
- [ ] `PAYMENT_PROVIDERS` set (wrangler `[vars]`, `stripe`); never `mock`
- [ ] Each enabled provider's webhook points at `www.…/api/payments/webhook/<provider id>` and its signing secret is set
- [ ] D1 database created, `database_id` in `wrangler.toml`, migrations applied
- [ ] Google OAuth client created, redirect URI `https://www.…/auth/callback`; `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `ADMIN_EMAILS` set as Worker secrets (`AUTH.md`)
- [ ] Keystatic GitHub app created (`/keystatic` setup flow) and `repo` set in `keystatic.config.ts`
- [ ] Content edits commit to `main`, which triggers the Workers build (no separate hook)

## 3. Environments

`local` → `preview` (every PR, Workers preview URL) → `production`. Stripe test keys in local + preview, live keys only in production.

## 4. Branch and PR rules

`main` is the only long-lived branch. PR body from `.github/pull_request_template.md` (`pull-requests.mdc`).

## 5. Pipeline checks

`pnpm predeploy`: branch-base → typecheck → lint → test → build → e2e (`predeploy.mdc`).

## 6. Rollback

- **Code** — revert merge commit or promote the previous Cloudflare deployment.
- **Data** — orders in D1 are append-only plus status updates; restore from a `wrangler d1 export` or Time Travel. Content restores via git revert. Stripe holds payment truth.

## 7. Search and speed gates

- [ ] `SITE_ORIGIN` set to the production origin and `SEO_STRICT=1` on the production build (build fails on a placeholder origin)
- [ ] `pnpm check:site` green: metadata, Open Graph, schema.org, sitemap, links, bundle budgets (`seo.mdc`, `performance.mdc`)
- [ ] Rebuild at least weekly (scheduled deploy): the home page's Event `startDate` is the next Monday computed at build time
- [ ] After launch: submit `/sitemap-index.xml` in Google Search Console, check Rich Results Test on `/` and a product page, watch Core Web Vitals field data
