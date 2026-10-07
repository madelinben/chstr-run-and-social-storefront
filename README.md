# CHSTR Run & Social: website

One repo, two prototypes of the same club website, so deployment strategy and running cost can be compared.

| App | Stack | Backend |
|---|---|---|
| [`chstr-run-and-social-cloudflare`](./chstr-run-and-social-cloudflare) | Astro on Cloudflare Workers | Self-hosted: D1 orders, Keystatic content, pluggable payment providers (Stripe first), Google staff sign-in |
| [`chstr-run-and-social-shopify`](./chstr-run-and-social-shopify) | Astro, static | Shopify: Storefront API (products, cart), Shopify hosted checkout and admin |

Each app is standalone: its own `package.json`, lockfile, `.cursor/rules`, docs and agent entry files (`CLAUDE.md`, `AGENTS.md`, `PROJECT_RULES.md`). Work inside the app folder:

```bash
cd chstr-run-and-social-cloudflare   # or chstr-run-and-social-shopify
pnpm setup && pnpm dev
```

Shared at the repo root: `.github/` (CI per app, path-filtered; one PR template) and `.githooks/` (pre-push runs `pnpm check` in both apps). Hooks are wired by each app's `pnpm setup` / `postinstall`.

Both apps share the same look, pages and SEO/performance contract (`seo.mdc`, `performance.mdc`, enforced by `pnpm check:site`). There are no shared packages by design: a duplicated file is cheaper than a coupled release while this is a prototype. Fix a shared component in both.

## Documentation

- [`docs/PREDEPLOY_CHECKLIST.md`](./docs/PREDEPLOY_CHECKLIST.md): every SEO, speed, accessibility, mobile and security check, how each is enforced, and the launch-day steps
- [`docs/DEPLOYMENT_STRATEGY.md`](./docs/DEPLOYMENT_STRATEGY.md): production hosting and Shopify plan decision, costs, alternatives and what is still unverified
- [`docs/FINDINGS.md`](./docs/FINDINGS.md): what we learned (Shopify, GitHub Pages, Astro 7, performance, product images) and the open questions for the club
- Per app: `docs/` and `.cursor/rules/` inside each app folder
