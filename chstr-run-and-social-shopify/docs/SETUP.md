# Setup — local development

Production shipping: [DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md).

## Prereqs

- Node 22+, `corepack enable` (pnpm pinned in `package.json`)
- A Shopify store with a Storefront API public token (`environment/shopify.md`)

## First-time setup

```bash
git clone <url>
pnpm setup    # install + seed .env.local + git hooks
```

Fill `PUBLIC_SHOPIFY_STORE_DOMAIN` and `PUBLIC_SHOPIFY_STOREFRONT_TOKEN` in `.env.local`. Var table: `CONFIG.md`.

## Day-to-day

```bash
pnpm dev      # http://localhost:4321
```

No store yet? Run `node scripts/mock-storefront.mjs` and set `PUBLIC_SHOPIFY_STOREFRONT_URL=http://localhost:4400` in `.env.local`. It serves two sample products and an in-memory cart. e2e builds against it.

Test checkout with a Shopify test order (Bogus Gateway on a development store, or Shopify Payments test mode).

## Test

```bash
pnpm test
pnpm test:e2e
pnpm check        # before every push
pnpm predeploy    # before merge
```
