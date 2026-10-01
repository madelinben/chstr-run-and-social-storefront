# Cloudflare (this target)

Loaded because `DEPLOYMENT_STRATEGY.md` § 1 picked Cloudflare Pages. Generic gates: `predeploy.mdc`, `dev-checks.mdc`.

## Pages project

| Setting | Value |
|---|---|
| Git integration | GitHub repo, production branch `main` |
| Framework preset | Astro |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Root directory | `chstr-run-and-social-shopify` (the repo holds two apps) |
| Node | 22 (`NODE_VERSION` env var) |

Static output, no adapter, no Functions.

## Environment

- Source of truth = Pages project env vars (Preview and Production set separately). Local: `.env.local`.
- `.env.example` lists every variable with no real values. Add a var there in the same change that reads it.
- Every var is `PUBLIC_`; there are no secrets. Preview uses the development-store token, Production the live-store token.

## Install + lockfile

Pages installs with the lockfile: commit `pnpm-lock.yaml` with every dependency change. `packageManager` pins pnpm.

## DNS + email

- `www.` → the Pages project (custom domain); checkout lives on Shopify’s domain.
- Cloudflare Email Routing forwards staff mailboxes. It does not send — order emails are Shopify notifications.

## Preview vs production

- Every PR gets a Preview deployment; put its URL in the PR body (`pull-requests.mdc`).
- Production = pushes to `main` only. Rollback = promote the previous deployment in the dashboard or revert the merge.
- Deploy hook: `Settings → Builds → Deploy hooks`; call it (scheduled or manually) after adding products.

## Do not

- Hardcode the store domain — read `PUBLIC_SHOPIFY_STORE_DOMAIN`.
- Commit `.env*`.
- Loosen the build command to make a failing build pass.
