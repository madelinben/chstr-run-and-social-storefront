# chstr-run-and-social-website — repo entry

Two standalone Astro apps in one git repo. Pick the app you are changing and work from its folder:

- `chstr-run-and-social-cloudflare/` — self-hosted prototype (Cloudflare Workers, D1, Keystatic, payment-provider seam, Google sign-in)
- `chstr-run-and-social-shopify/` — Shopify-backed prototype (Storefront API, hosted checkout)

Every rule and doc lives inside the app: start at that app's `CLAUDE.md`, which lists the always-on rules in its `.cursor/rules/`. This root has no rules of its own.

Repo-level files only: `README.md`, `.github/` (CI per app, one PR template), `.githooks/`. Before handing work back, run `pnpm check` (and `pnpm build && pnpm check:site` for pages) in each app you touched. The apps share a design and an SEO/performance contract but no code: apply a shared change to both.
