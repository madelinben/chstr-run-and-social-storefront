# Production deployment strategy (Shopify app)

Decision record for taking the CHSTR Run & Social site from the GitHub Pages preview to production, with costs and the alternatives we looked at.

**Status of the figures.** Prices and fees below were supplied from research outside this repo (UK, October 2026). They have not been verified against each vendor's pricing page. Every row marked **(check)** must be confirmed before it goes to the club or into a decision. Update the date at the bottom when you do.

## 1. What we built and what it depends on

- Static Astro site. Products, cart and checkout use Shopify's **Storefront API** and Shopify's hosted checkout. Everything else (events, sessions, FAQs, members, pictures, contact links) is JSON and markdown in the repo, editable at `/admin/` (`chstr-run-and-social-shopify/docs/ADMIN.md`).
- There is **no separate "headless" Shopify subscription**. The Storefront API is part of the normal plans. The Headless sales channel app is only a free token generator; we created our token through a Dev Dashboard app instead (see `FINDINGS.md`).
- Only customising the checkout page itself needs Shopify Plus. We do not need that.
- Hosting is independent of Shopify. Any static host works.

## 2. Recommended route

Keep the custom site. Shopify stays the shop backend. Host the static site on **Cloudflare** (free tier) on a real domain, and keep GitHub as the content store behind the admin.

| Item | Cost | Notes |
|------|------|-------|
| Shopify Basic | £25/month, or £19/month billed annually **(check)** | Intro offer reported as a short free trial then £1 for the first month **(check)** |
| Card fees (Shopify Payments) | about 2% + 25p per sale **(check)** | Varies by plan and country. A third-party gateway adds an extra Shopify fee |
| Hosting | £0 | Cloudflare free tier at our traffic. GitHub Pages is also free (see risk below) |
| Domain | about £5 to £10 a year **(check)** | `.co.uk` about £5, `.com` about £9. Buy at Cloudflare (at cost) or in Shopify |
| Admin, SEO, performance tooling | £0 | In the repo, run in GitHub Actions free minutes |

Ongoing cost is the Shopify subscription plus the yearly domain.

### Hosting risk to resolve before launch

GitHub's Pages terms say Pages is not intended as free hosting for an online business or a site mainly for commercial transactions **(check the current terms)**. A merch shop is borderline. The preview is fine; for production move to Cloudflare (Pages or Workers static assets). The deploy workflow already builds a static `dist/`, so the move is mostly changing the publish step and setting `SITE_ORIGIN`.

## 3. Alternatives considered

All figures from the same unverified research.

| Option | Monthly (annual billing) | Transaction fees | Setup | Fit for us |
|--------|--------------------------|------------------|-------|------------|
| Big Cartel Gold | £0 | Stripe/PayPal fees only | Separate shop, link from our site | Cheapest. 5 products max (about £12/month for 50). Loses the on-site cart and shop design |
| Shopify Starter | £5 | 5% + 25p | Embedded "Buy Button" | See warning below |
| Wix Core | about £16 | about 2% + 30p, no platform fee | All-in-one, replaces our site | Good built-in events/booking. Throws away the custom site |
| Squarespace Core | £17 | 3% + card fees (0% platform fee needs the £29 Plus plan) | All-in-one, replaces our site | Easy for non-technical editing. Weaker commerce than Shopify |
| Shopify Basic | £19 (£25 monthly) | about 2% + 25p | Our headless site, or Shopify's own store | Current plan. Everything already built against it |

### Shopify Starter warning

Starter is built for selling through links, social and messaging, not a custom storefront. It may not allow Storefront API access, and Shopify has been reducing Buy Button support **(check both before relying on this route)**. Our site uses the Storefront API for the product pages and cart, so Starter could mean rebuilding the shop part.

### Break-even: Starter versus Basic

Starter saves about £20 a month in subscription but costs about 3 percentage points more per sale (5% vs 2%). Break-even is roughly £20 / 0.03, so about £650 to £700 of merch a month. Below that Starter is cheaper; above it Basic is. This only matters if Starter supports our setup.

### Leaving our site entirely

Wix, Squarespace and Big Cartel all mean abandoning the built site, its SEO and performance work, the admin and the event/calendar features. That trade only makes sense if the club wants no code involved at all.

## 4. Admin and content ownership

- The admin edits content and commits to GitHub. Editors need a GitHub account with access to the repo and a fine-grained token (this repo only, Contents read/write, short expiry). Steps in `chstr-run-and-social-shopify/docs/ADMIN.md`.
- Products, prices, stock and orders are managed in Shopify, not the admin.
- Before a real domain, put Cloudflare Access in front of `/admin/*`. Static hosting cannot hide the page; today the lock is the token.

## 5. Go-live checklist (summary)

Full list: `PREDEPLOY_CHECKLIST.md` section 6.

1. Shopify: paid plan, products with real prices, stock and descriptions, test checkout with the test gateway.
2. Decide hosting (Cloudflare recommended) and move the publish step.
3. Buy the domain, enable HTTPS, set repo variable `SITE_ORIGIN`.
4. Set `SITE_NOINDEX=0` to let search engines in; verify Search Console; submit the sitemap.
5. Add the WhatsApp group invite in the admin; confirm waiver and booking links.
6. Decide admin protection (Cloudflare Access) and switch `ADMIN_ENABLED` accordingly.
7. Confirm the figures marked **(check)** above, and record the date.

## 6. Open items

- Verify every **(check)** figure and the GitHub Pages and Shopify Starter points.
- Decide Basic annual (£19/month, committed) versus monthly (£25/month).
- Choose the domain registrar and name.
- Decide whether football and netball charge (affects schema.org on the events page; see `FINDINGS.md` section 7c).

Figures last confirmed: not yet.
