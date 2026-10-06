# Shopify (this project's commerce backend)

Shopify is the product CMS, checkout, payments, order database and staff order UI. This repo holds no commerce backend code.

## Setup

The Headless sales channel is not on every plan, so this project uses a **Dev Dashboard app** to get the Storefront token.

1. Create the store. Starter/Basic is the cost target; verify current plan limits.
2. Add products with variants named by size, a description, photos and a price.
3. Dev Dashboard → create an app (e.g. "CHSTR Storefront"). In its version's **Scopes** add, comma-separated with no spaces or full stop: `unauthenticated_read_product_listings,unauthenticated_read_product_inventory,unauthenticated_write_checkouts,unauthenticated_read_checkouts`. Release the version and **install the app on the store**.
4. Make the products available to the app: on each product, under Sales channels and markets, tick the app's channel (it appears once the app has Storefront scopes).
5. Create `.env.admin` next to `package.json` (gitignored, never committed or pasted anywhere) with `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, then run `node scripts/create-storefront-token.mjs`. It exchanges the client credentials for a short-lived Admin API token, mints (or reuses) a **public** Storefront token titled "CHSTR website", and prints only the domain and public token. Put those in `.env.local` as `PUBLIC_SHOPIFY_STORE_DOMAIN` and `PUBLIC_SHOPIFY_STOREFRONT_TOKEN`.
6. Enable local pickup for the Chester location; customise the "ready for pickup" notification.

The client secret and any Admin token stay on your machine. Only the public Storefront token ever ships to the browser. The same app can later subscribe to product webhooks to trigger rebuilds.

## How the site uses it

| Job | Mechanism |
|---|---|
| Product list/detail | `get*Server` functions in `data/Product/` call `services/shopify` at build time |
| Live price/stock | client island refetches the product on view |
| Cart | `cartCreate` / `cartLinesAdd` / `cartLinesUpdate` / `cartLinesRemove`; browser stores only the cart id |
| Checkout | redirect to the cart’s `checkoutUrl` (Shopify-hosted, handles Apple Pay, Google Pay, cards) |
| New-product visibility | static pages rebuild on a Cloudflare Pages deploy hook (manual or scheduled); stock/price are live |

Only `src/services/shopify/` calls the Storefront API (one typed client, GraphQL documents beside it). Storefront API version is pinned in one constant there.

## Order status mapping

The Shopify project has no custom state machine. Staff use Shopify’s own states:

| Club step | Shopify |
|---|---|
| Paid, to order from printer | Order unfulfilled (tag `needs-supplier`) |
| Ordered from supplier | tag `ordered-from-supplier` |
| Ready for pickup | fulfilment with local pickup → “ready for pickup” notification |
| Fulfilled | Picked up / fulfilled |
| Refunded | Shopify refund |

Staff batch with Shopify order filters on tags. Staff ping on a new order = built-in Shopify “New order” notification.

## Limits to verify in the prototype

Storefront API rate/cost limits, Starter plan feature set, custom-domain checkout, and whether tags can be applied in bulk from the mobile app.
