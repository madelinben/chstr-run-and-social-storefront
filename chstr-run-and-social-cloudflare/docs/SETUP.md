# Setup — local development

Production shipping: [DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md).

## Prereqs

- Node 22+, `corepack enable` (pnpm version pinned in `package.json`)
- Stripe CLI, for webhook testing
- A Cloudflare account (free) for D1 and Workers
- A Google Cloud project with an OAuth client, for staff sign-in (`AUTH.md`). Local tests need no real client

## First-time setup

```bash
git clone <url>
pnpm setup    # install + seed .env.local + git hooks
pnpm db:migrate:local   # local D1 (SQLite)
```

Fill `.env.local`. Var table: `CONFIG.md`.

## Day-to-day

```bash
pnpm dev                                        # http://localhost:4321
stripe listen --forward-to localhost:4321/api/payments/webhook/stripe
```

Test card: `4242 4242 4242 4242`.

## Test

```bash
pnpm test
pnpm test:e2e
pnpm check        # before every push
pnpm predeploy    # before merge
```

## Content editing (Keystatic)

Keystatic stores to GitHub only (`keystatic.config.ts`): its local-file mode needs Node and does not run in the workerd dev runtime. Until the GitHub app exists, edit `src/content/products/*.md` and `src/content/faqs/*.md` by hand; the schema is in `src/content.config.ts`.
