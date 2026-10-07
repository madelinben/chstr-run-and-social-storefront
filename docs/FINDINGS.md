# Findings

What we learned while building and testing the two prototypes, so nobody has to rediscover it. Newest items are at the bottom of each section. Open questions are collected in section 9.

## 1. Brand and club facts

| Fact | Value | Source |
|---|---|---|
| Name | CHSTR Run & Social | club |
| Motto | "All people, all paces, all welcome." | club |
| Run | Mondays 18:30, The Architect, Chester. Always free | brief |
| Football | Thursdays 8pm to 9pm, Chester University Football Pitches, Parkgate Rd, Chester CH1 4BJ | club |
| Netball | The Cheshire County Sports Club, Plas Newton Ln, Chester CH2 1PR; booked online through Back to Netball | club |
| Lights | Required on dark nights: head torch, reflective running vest with lights, or any light. Shown on home, waiver, events and FAQs | club |
| Merchandise | pay online, collect at a Monday run; no delivery | brief |
| Waiver | Jotform link, signed once before the first session | brief |

Where these live in code: `src/domain/session/session-schedule.ts` (times and venues), `src/features/session-overview/config.ts` (netball, activities), `src/utilities/brand.ts` (name and motto), `src/content/faqs/` (FAQ answers).

## 2. Shopify

- **The Headless sales channel is not available on this plan.** We do not need it. A **Dev Dashboard app** can mint a *public* Storefront access token through the Admin API (`storefrontAccessTokenCreate`), which inherits the app's `unauthenticated_*` scopes. `scripts/create-storefront-token.mjs` does it from the app's client id and secret (kept in the gitignored `.env.admin`; only the public token is printed).
- **The scopes field wants a plain comma-separated list**, with no "and" and no full stop. A pasted sentence gives "Contains invalid scopes".
- **The app must be released and installed on the store**, and products must be available to the app's sales channel, or the Storefront API returns nothing.
- **Storefront API works on this plan** (products, cart, checkout redirect). API version is pinned in `src/services/shopify/storefront-client.ts`.
- **Store domain**: `v3r03g-8p.myshopify.com`. The token and domain are public values.
- **What the live catalogue looked like at first read**: six products, every variant at £0.00, zero stock (so everything "sold out"), no descriptions, an option called "Color" (US spelling) rather than sizes, landscape photos with the supplier's "Product Code" labels, and one handle (`jumper`) that does not match its title ("Heavyweight Hoodie").
- **Decisions that follow**: free products are legitimate and show as "Free"; mixed prices show a range and each choice shows its own price; an empty catalogue builds and shows "New merch is on the way" instead of failing; options are labelled with whatever the store calls them.
- **Orders in Shopify** use native states (see `docs/environment/shopify.md` in the app); there is no custom state machine.
- **Checkout is Shopify-hosted.** On a trial or dev store it only takes test payments; real payments need a paid plan and a payments provider.

## 3. GitHub and hosting

- **GitHub Pages serves private repos only on a paid plan.** On a free account the repo must be public. We made it public; the source holds no secrets.
- **Project sites live under a sub-path** (`/<repo>/`). The site therefore routes every internal URL through `withBase` (`src/utilities/with-base.ts`), including links inside rendered markdown. The quality gate fails the build on a link missing the base.
- **Pages must be set to "GitHub Actions" as its source.** The older "deploy from branch" mode runs its own Jekyll job that fails on every push.
- **The repo was renamed** to `chstr-run-and-social-storefront`; the local folder name differs. GitHub redirects the old name.
- **A fine-grained or classic token needs the `workflow` scope** to push `.github/workflows` files; `gh auth refresh -s workflow` adds it.
- **The preview is `noindex` by design** until a real domain exists, so it cannot compete with the final site. One repo variable (`SITE_NOINDEX`) flips it.
- **Weekly rebuild**: the Monday schedule exists because the schema's next-session date is computed at build time.
- **Git identity**: this repo uses `dev.madelinben@gmail.com` locally, not the global work address.
- **The npm registry intermittently times out** (`ERR_PNPM_META_FETCH_FAIL`). Re-run the install; avoid adding heavy dev dependencies (Lighthouse CI runs through `npx` for this reason).

## 4. Astro 7 and tooling

- Astro 7 runs `astro dev` and `astro preview` as **background daemons that exit immediately**. Playwright's web server therefore runs `... && sleep 3600`, and a second `preview` reports "already running". If port 4321 is taken, the e2e suite reuses whatever is there; set `E2E_PORT` to run beside a dev server.
- **TypeScript 7 is not supported by `typescript-eslint`**; the repos pin TypeScript 6.
- **Markdown plugins are no longer bundled** with Astro 7, so base-path rewriting of markdown links is done on the rendered HTML (`withBaseInHtml`) instead of a rehype plugin.
- **`sharp` must be a direct dependency** for build-time image optimisation to work (it was only transitive in the Cloudflare app).
- **ESLint**: `no-restricted-imports` is a single rule, so a later config block replaces an earlier one. The Cloudflare app's vendor-SDK block was silently disabling its layer-boundary rules until both were merged.
- **Cloudflare adapter v14 targets Workers**, and rejects a Pages config (`ASSETS` binding is reserved). The Cloudflare prototype is therefore a Worker with static assets.
- **Keystatic local-file mode does not run** on Astro 7 with the Cloudflare adapter (workerd cannot do the file I/O; the integration's injected route also fails to resolve under Astro 7). The Cloudflare prototype uses GitHub storage only; the CMS write path is **still unverified**.

## 5. Performance and SEO findings

- Replacing GSAP/ScrollTrigger with CSS transitions plus one `IntersectionObserver` removed **44 KB gz** from every page; dropping `zod` from browser code removed about **24 KB**; JS per page went from about 141 KB to about 78 KB.
- **Above-the-fold content must not wait for the reveal script.** Lighthouse CI measured the gallery LCP at **2.9 s** because the first row started transparent; removing the reveal from the first row brought it to **1.5 s**.
- **A shared `check:site` gate** catches regressions that tests miss: missing images after a missing dependency, broken base-path links, descriptions that are too short, a sitemap without a page, an orphaned page.
- **Calendar text escaping**: a `;` in event text silently broke the `.ics` format until escaping was fixed and tested. A linter flagged it.
- **Timezones**: session times are computed in `Europe/London`, with unit tests across both clock changes.
- **Mobile**: the header wrapped to three lines until the nav became one scrollable row; the reveal effect pushed content a few pixels off-screen until `overflow-x: clip` was added to `main`.

## 6. Product images

- The supplier mock-ups (`chstr-run-and-social-shopify/assets/images/`) show **front on the left half and back on the right half**; the caps show a model in a blue cap, and the half-zip is a single view.
- `pnpm images:products` (`scripts/prepare-product-images.mjs`) blanks the supplier labels ("Product Code", "Print Size"), cuts out the front and back, trims the margin, centres each on an 800 x 800 canvas, removes the model's blue cap, and writes 7 to 20 KB WebP files plus a 1200 x 630 share image per colour. Re-run it after changing a source image or the table at the top of the script.
- Pictures are matched to Shopify products by **handle** in `src/data/Product/product-media.ts`; products without an entry fall back to their Shopify uploads. Colours without a source picture (green T-shirt, black long-sleeve) fall back to the colours we do have.
- On hover (or keyboard focus) a card fades from the front to the back view; touch screens keep the front.

## 7. Calendar and events

- `/events/` and `/chstr-sessions.ics` are generated from the same schedule data as the home page schema.
- The Monday run has no fixed end; calendar entries default to **one hour**. Football runs 20:00 to 21:00.
- Netball is run by Chester Netball Club, so the page links to their Back to Netball page and says times and booking are theirs.
- The calendar feed refreshes on each build (weekly).

## 8. Things we could not do, and why

- **Mine Instagram and Facebook for past questions.** Both block automated reading and neither page is indexed by search, so we could not read comments. The FAQ answers only facts the club has given us. Please paste real questions to extend it (see section 9).
- **Verify Search Console.** It needs the live URL and a Google account (checklist section 6).
- **Test a real checkout and the Cloudflare prototype end to end.** They need paid-plan payments and credentials the club has not set up yet.
- **A real WhatsApp invite link** was not available, so the Join button is built but hidden until `PUBLIC_WHATSAPP_GROUP_URL` is set.

## 9. Open questions for the club

1. The **WhatsApp group invite link** (`https://chat.whatsapp.com/...`).
2. **Netball**: the public Back to Netball page lists **Tuesdays 8:00pm to 9:30pm** at the Cheshire County Sports Club and says "simply turn up and join in", with no booking link. You said it must be booked online through Back to Netball. Which is right, and is there a specific booking link to use?
3. **Football**: is it free? Is there anything to bring or book?
4. What does the **asterisk on 3XL\*** in the size guide mean (the guide image has no footnote)? It is omitted from the site until we know.
5. Is the size guide measurement **chest** (we assumed so) and do 3XL and 4XL have UK sizes?
6. How long does the **Monday run** last, and what time does the social start? Calendar entries default to one hour.
7. Pace groups, **bag drop** and what happens after the run: the home page and FAQs describe them briefly from the original brief. Please confirm or correct the wording.
8. **Product data in Shopify**: prices, stock settings, descriptions and tidy handles (see section 2).
9. **Real photos**: the gallery and hero currently use illustrations. Replace them using the steps in `.cursor/rules/theme.mdc`.
10. **Street address of The Architect**, so the weekly run's location can be a full address in the schema and on the Events page.
11. A **returns policy** for merchandise, so shipping and returns schema can be added.
