# Predeploy checklist: SEO, speed, accessibility and security

Run this before any public launch and before pointing a real domain at the site. The Shopify site is a public storefront: search visibility, Core Web Vitals and bundle size are product features.

How to read it: **Auto** items fail the build or the GitHub Actions pipeline, so they cannot regress silently. **Manual** items need a person, usually because they need the live domain or a Google account.

Commands run from `chstr-run-and-social-shopify/`.

```bash
pnpm check                         # lint + typecheck
pnpm test                          # unit tests
pnpm build && pnpm check:site      # the SEO / schema / links / size-baseline gate (Auto)
pnpm test:e2e                      # behaviour + axe accessibility at desktop and phone width (Auto)
pnpm lhci                          # Lighthouse CI: Core Web Vitals + category scores (Auto)
```

CI (`.github/workflows/ci-shopify.yml`) runs all of the above on every push and pull request. `deploy-shopify-pages.yml` builds against the live store, runs `check:site`, and publishes.

## 1. Search engines can find and understand every page

| Item | How | Status |
|---|---|---|
| `sitemap.xml` | `@astrojs/sitemap` writes `/sitemap-index.xml`; `check:site` fails if an indexable page is missing from it or a noindex page is in it | Auto |
| `robots.txt` | `src/pages/robots.txt.ts`: allows `/`, disallows staff paths, has an absolute `Sitemap:` line; preview mode is `Disallow: /` | Auto |
| Remove `noindex` | One switch: repo variable **`SITE_NOINDEX`** (`1` = preview, `0` = public). It sets `PUBLIC_SITE_NOINDEX`, which controls the meta robots tag, `robots.txt` and the sitemap together. `check:site` fails if any page disagrees with the mode. **Flip it to `0` only on the real domain** (see section 6) | Auto + Manual decision |
| Canonical tags | One absolute canonical per page equal to its own URL, trailing slash; `check:site` | Auto |
| Meta titles | 15 to 60 chars, unique, primary keyword near the start, brand suffix; long product names are trimmed automatically (`meta-text.ts`); `check:site` | Auto |
| Meta descriptions | 70 to 160 chars, unique; product descriptions are padded or trimmed automatically; `check:site` | Auto |
| One `<h1>` per page, heading order | exactly one `h1`, no skipped levels; `check:site` and axe | Auto |
| Alt text | every `<img>` has `alt`; empty only when decorative (inside an `aria-hidden` block or a link that has text); gallery and product pictures describe the content; `check:site`, axe, e2e | Auto |
| Schema markup | one JSON-LD `@graph` per page; required properties per page type verified; values must match visible text (prices, FAQ answers); `check:site` | Auto |
| Internal links | breadcrumbs, footer and header nav, contextual links (home to events, gallery, shop; product to related products, FAQs, events); `check:site` fails on an **orphan page** nobody links to | Auto |
| Broken links | every internal `href` must resolve to a built page or file, with a trailing slash (no redirect hop); `check:site` | Auto |
| Clean URL slugs | lowercase, hyphenated, trailing slash; product slugs come from the Shopify **handle**. `check:site` warns when a handle does not match the product title (for example `jumper` for "Heavyweight Hoodie"). Fix in Shopify (Products, Search engine listing, URL handle). Shopify offers to redirect the old URL; also rename the handle in `src/data/Product/product-media.ts` if that product has custom pictures | Auto (warning) + Manual |
| `og:image` | `og-default.png` is 1200 x 630; each product has its own 1200 x 630 share image (front and back side by side) from `pnpm images:products`; `check:site` verifies size and that it is absolute and not an SVG | Auto |
| `llms.txt` | `src/pages/llms.txt.ts` builds a plain-language site map from the same data as the pages; `check:site` verifies it exists and is well formed | Auto |
| Verify Search Console | see section 6; the HTML tag is emitted when `PUBLIC_GOOGLE_SITE_VERIFICATION` is set and `check:site` verifies it | Manual |

### schema.org coverage review (what we have, and what we deliberately do not)

| Type | Where | Notes |
|---|---|---|
| `Organization` + `SportsClub`, `WebSite`, `WebPage` | every page | name, motto as `slogan`, logo, `sameAs` (social), `contactPoint` when email or WhatsApp is configured |
| `BreadcrumbList` | every page except home | |
| `Event` (weekly, with `eventSchedule`) | `/` (run), `/events/` (run and football) | next date computed at build, so the site rebuilds every Monday. The run is marked free; football is not, because cost is not confirmed |
| `FAQPage` | `/faqs/` | one `Question` per visible answer |
| `CollectionPage` + `ItemList` | `/merchandise/` | omitted when the shop is empty |
| `Product` + `Offer` per variant | each product | real price (free items price `0`), real availability, GBP, images |
| `ImageGallery` | `/gallery/` | |
| `ContactPage` | `/contact/` | |

Considered and **not** added, with reasons:

- `AggregateRating` / `Review`: only with real, visible reviews. Never invent them.
- `OfferShippingDetails` / `MerchantReturnPolicy`: Google's merchant listings want these. Delivery is pickup-only and returns policy is unwritten. Add once the club decides its returns policy, because wrong values are worse than none.
- `SportsActivityLocation` / `Place` for each venue: the three venues appear inside `Event.location` with full addresses where known. A standalone location page is worth it only if venues get their own pages.
- `SearchAction`: there is no site search.
- `Article` / `BlogPosting` / `VideoObject`: no blog or video yet. Add with the first post or video.
- `LocalBusiness` opening hours: not a shop with opening hours.

## 2. Speed and Core Web Vitals

| Item | How | Status |
|---|---|---|
| LCP <= 2.5 s, CLS <= 0.1, TBT <= 200 ms | `lighthouserc.cjs` asserts these and category scores >= 95 (mobile, simulated slow 4G) on 6 templates; fails the pipeline | Auto |
| Bundle size baseline | `scripts/size-baseline.json` holds JS, CSS and HTML gzip size per page template; `check:site` fails if one grows by more than 10% or 1.5 KB. Intentional growth: justify it in the PR, then `pnpm baseline:update` and commit the file | Auto |
| Hard budgets | JS <= 100 KB, CSS <= 20 KB, HTML <= 25 KB gzip (70 KB raw), 2 preloaded fonts, images <= 200 KB, zero third-party origins; `check:site` | Auto |
| Compress images | Astro makes WebP for gallery and product pictures; originals live in `assets/images/` and `src/assets/gallery/`; `pnpm images:products` crops and compresses supplier mock-ups to 7 to 20 KB each; Shopify CDN images use the `?width=` parameter. Any single image > 200 KB fails | Auto |
| Above-the-fold content never waits for JavaScript | scroll-reveal is only for content below the first screen (`data-reveal` is off for the first row of gallery, shop and FAQs). Found by Lighthouse CI: the gallery LCP was 2.9 s until this was fixed | Auto (LCP assertion) |
| Real-world check | PageSpeed Insights on the live URL and the Core Web Vitals report in Search Console after traffic | Manual |

Last measured (Lighthouse mobile, built site): Performance 99 to 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.4 to 2.0 s, CLS 0, TBT 0 ms.

## 3. Accessibility

| Item | How | Status |
|---|---|---|
| WCAG 2.1 A and AA, plus best practices | `e2e/accessibility.spec.ts` runs axe on every public page at 1366 px and 360 px wide, and on the open size-guide dialog | Auto |
| Landmarks and labels | `header`, `nav aria-label="Main"`, `main`, `footer`, `nav aria-label="Footer"`, skip link, labelled dialogs (cart, size guide), decorative marquees and collage are `aria-hidden` | Auto (axe) |
| Keyboard | native `<details>`, `<dialog>` and buttons; the size guide closes on Escape and returns focus (tested) | Auto |
| Motion | `prefers-reduced-motion` stops the drifting columns and reveals (tested) | Auto |
| Screen reader pass | VoiceOver or NVDA on home, a product and the cart | Manual |
| Colour contrast | axe checks text contrast on the page as people see it; re-check any new brand colour | Auto + Manual |

## 4. Mobile first

Every layout is designed for a 360 px phone first and enhanced at `sm` / `md` / `lg`.

| Item | How | Status |
|---|---|---|
| No sideways scroll | e2e checks home, FAQs, shop, waiver, contact at 390 px; axe runs at 360 px | Auto |
| Tap targets and touch | controls are at least 40 px tall (`min-h-10`); Lighthouse `target-size` asserted | Auto |
| Header | logo and cart on the first row, scrollable nav row below with an edge fade | Auto |
| Real device | open the preview on an iPhone and an Android phone: hero, cart, size guide, events | Manual |

## 5. Security and transport

| Item | How | Status |
|---|---|---|
| Enforce HTTPS | GitHub Pages: Settings, Pages, **Enforce HTTPS** (already on). `check:site` fails on any `http://` URL in the built HTML. On Cloudflare later: Always Use HTTPS and HSTS | Auto + Manual |
| One canonical host | `www` canonical; apex redirects to it (Cloudflare redirect rule later). On GitHub Pages with a custom domain, set the domain once and let GitHub redirect | Manual |
| No secrets in the repo | only public values ship (`PUBLIC_*`); client secret and admin token live in the gitignored `.env.admin`. Storefront token is public by design | Auto (`.gitignore`) + Manual review |
| Third parties | none on public pages; `check:site` fails on any new external script, stylesheet or iframe | Auto |

## 6. Launch day (Manual)

1. **Content in Shopify is finished**: every product has a price, stock (or "continue selling when out of stock" for supplier-ordered items), a description, and a tidy handle. Test a checkout with the Shopify test gateway.
2. **Real domain**: add it in GitHub Pages (or Cloudflare), turn on Enforce HTTPS, then set repo variable `SITE_ORIGIN=https://www.<domain>`. The deploy workflow then builds for the domain root and ignores the `/repo/` path.
3. **Let search engines in**: set repo variable `SITE_NOINDEX=0`, and optionally `SEO_STRICT=1` on the build so it refuses a placeholder origin. Re-run **Deploy Shopify site to GitHub Pages**.
4. **Search Console**: add a URL-prefix property for the live URL, choose the HTML tag method, copy the `content` value, set repo variable `PUBLIC_GOOGLE_SITE_VERIFICATION`, redeploy, click Verify. Submit `/sitemap-index.xml`. Use URL Inspection on the home page and one product, then Request indexing.
5. **Rich Results Test** (search.google.com/test/rich-results) on `/`, `/events/`, `/faqs/` and a product page. Fix anything it flags.
6. **PageSpeed Insights** on the live home, shop and a product page (mobile). Compare with the numbers in section 2.
7. **Links that need real values**: `PUBLIC_WHATSAPP_GROUP_URL` (the Join button is hidden until it is set), the waiver link, the Back to Netball booking page (confirm it is still the right booking route), Instagram and Facebook.
8. **Social previews**: paste the home page and a product URL into Facebook's Sharing Debugger and a WhatsApp chat; check the image and title.
9. **Weekly rebuild** is scheduled for Mondays so the Event dates stay current; confirm the first scheduled run succeeded.
10. **Shopify webhooks** (products create, update, delete) to trigger a rebuild, if staff should not have to click Run workflow.

## 7. When a check fails

- **Size baseline**: look at which page template grew and why (new dependency, new image, new island). If intended, `pnpm baseline:update` and commit.
- **Lighthouse**: open the artifact `lighthouse-reports` on the workflow run; the failing audit is named.
- **axe**: the failure lists the rule and the CSS selector.
- **`check:site`**: each line names the route and the rule. Rules are written down in `.cursor/rules/seo.mdc` and `performance.mdc`.
