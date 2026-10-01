# Shopify (this project's commerce backend)

Shopify is the product CMS, checkout, payments, order database and staff order UI. This repo holds no commerce backend code.

## Setup

1. Create the store (Starter plan is the cost target — verify current plan limits and that Storefront API access is available on it).
2. Add products with variants named by size; publish them to the **Headless** / Storefront API sales channel.
3. Create a Storefront API app (Settings → Apps → Develop apps) with scopes `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`, `unauthenticated_write_checkouts`, `unauthenticated_read_checkouts`. Use its **public** access token.
4. Enable local pickup for the Chester pickup location; customise the “ready for pickup” notification.

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
