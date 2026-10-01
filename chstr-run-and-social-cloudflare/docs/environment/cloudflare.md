# Cloudflare (this target)

Loaded because `DEPLOYMENT_STRATEGY.md` § 1 picked Cloudflare Workers. Generic gates: `predeploy.mdc`, `dev-checks.mdc`.

## Worker project

| Setting | Value |
|---|---|
| Git integration | GitHub repo, production branch `main` |
| Build command | `pnpm build` |
| Deploy command | `pnpm exec wrangler deploy` |
| Root directory | `chstr-run-and-social-cloudflare` (the repo holds two apps) |
| Node | 22 (`NODE_VERSION` env var) |

Adapter: `@astrojs/cloudflare`, `output: 'static'`. Only `src/pages/api/*` set `prerender = false` and run in the Worker.

## Environment

- Source of truth = Worker secrets and vars (Preview and Production set separately). Local: `.env.local`.
- `.env.example` lists every variable with no real values. Add a var there in the same change that reads it.
- In API routes read secrets from `locals.runtime.env`, not `process.env`.
- Stripe test keys in Preview, live keys in Production only.

## Install + lockfile

Workers Builds installs with the lockfile: commit `pnpm-lock.yaml` with every dependency change. `packageManager` pins pnpm.

## DNS + email

- `www.` → the Worker (custom domain); `/admin/*` and `/keystatic/*` are behind Google sign-in (`../AUTH.md`).
- Cloudflare Email Routing forwards staff mailboxes. It does not send — order notifications use Resend.

## Preview vs production

- Every PR gets a Preview deployment; put its URL in the PR body (`pull-requests.mdc`).
- Production = pushes to `main` only. Rollback = promote the previous deployment in the dashboard or revert the merge.
- Payment webhooks: `https://www.<domain>/api/payments/webhook/<provider id>`. Local Stripe: `stripe listen`. Provider seam: `docs/PAYMENTS.md`.

## Do not

- Hardcode a deploy origin — read `SITE_ORIGIN`.
- Commit `.wrangler/` or `.env*`.
- Loosen the build command to make a failing build pass.
