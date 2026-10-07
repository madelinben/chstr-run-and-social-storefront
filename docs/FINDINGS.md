# Findings

What we learned while building and testing the two prototypes, so nobody has to rediscover it. Newest items are at the bottom of each section. Open questions are collected in section 9.

## 1. Brand and club facts

| Fact | Value | Source |
|---|---|---|
| Name | CHSTR Run & Social | club |
| Motto | "All people, all paces, all welcome." | club |
| Run | Mondays 18:30, The Architect, Chester. Always free | brief |
| Football | Thursdays 8pm to 9pm, Chester University Football Pitches, Parkgate Rd, Chester CH1 4BJ | club |
| Netball | Tuesdays 7:30pm to 8:30pm, The Cheshire County Sports Club, Plas Newton Ln, Chester CH2 1PR; book online through Back to Netball: https://portal.sportskey.com/venues/cheshire-county-sports-club/events/PNMF01 | club |
| Monday routes | The route changes every week. A few favourites come round again, but never more than twice a month | club |
| Leaders | Corey runs the social and the football; Emily plans the routes and is an ASICS FrontRunner; Nathan plans the routes | club |
| Special events | 5 Oct 2026 popcorn, Life in Chester sign making for the Chester Marathon and bead making; 5 Sep 2026 The Big Run at FYP Gym, Saltney with Steazy Wrexham Run Club; 14 Jun 2026 10k run with Wrexham Run Club at The Architect; 18 Oct 2026 long run | club |
| Lights | Required on dark nights: head torch, reflective running vest with lights, or any light. Shown on home, waiver, events and FAQs | club |
| Merchandise | pay online, collect at a Monday run; no delivery | brief |
| Waiver | Jotform link, signed once before the first session | brief |

Where these live in code: `src/domain/session/session-schedule.ts` (weekly times, venues and the netball booking link), `src/data/Event/club-events.ts` (special events), `src/data/Member/members.ts` (leaders, local legends), `src/utilities/brand.ts` (name, motto, route rule), `src/features/session-overview/config.ts` (activities), `src/content/faqs/` (FAQ answers).

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
- **CI timing flake**: axe once sampled the banner label while its entrance animation was still fading in, reporting a contrast failure on the slower CI machine only. The accessibility tests now run with reduced motion (which the site honours), so they never sample text mid-animation.
- **Button "black edges" (hover and press)**: reported from a Windows browser, not reproducible in headless Chromium at 100%, 125%, 150% or 200% scale, so every plausible cause was removed: buttons no longer move with `transform` (a transformed button becomes its own GPU layer over the always-animating collage, and at fractional display scales the layer edges can show as dark seams); hover and press now use whole-pixel `top` offsets (`.press` in `global.css`); `will-change: transform` is gone from the collage; and the mobile tap highlight is off. A test asserts no transform on hover or press. If it still happens, send the browser, OS and zoom level.
- **Astro audit: "Headings and anchors must have an accessible name"**: the flagged anchors were image-only links hidden with `aria-hidden` on the shop and event cards (axe skips those, Astro's audit does not). Cards now have one named link, the title, stretched over the whole card, so there are no duplicate or empty links. `e2e/audit.spec.ts` runs the same check on every page at desktop, tablet and phone sizes.
- **Astro audit: "IMG above the fold could be eagerly-loaded"**: images in the opening viewport were `loading="lazy"`. They are now eager (only the LCP image has `fetchpriority="high"`); the same audit test fails if a lazy image is on screen at load. The old rule "only one eager image" was too blunt and was rewritten. The `/gallery/` page became a row-major grid (columns flow top-to-bottom, so "the first N images" were not the ones on screen).
- **Spacing**: sections each added their own 80 px top and bottom padding, so two plain sections in a row left a 160 px gap while others had none. One `.section-y` class now sets the rhythm, and adjacent sections collapse to a single gap (80 px, 56 px on phones).
- **Header cart button** wrapped onto two lines once the nav grew; it is now `whitespace-nowrap`. **Shop cards** in a row are equal height.
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

## 7b. Special events, members and type safety

- **Special events** are data (`club-events.ts`): each gets a page at `/events/<slug>/` with its own gallery, and the archive is `/events/past/`. Whether an event is past or coming up is decided at build time in London time (`domain/event`), and the Monday rebuild moves it across on its own: the **18 Oct 2026 long run** is shown as a special event until the day has passed.
- **Dates are plain calendar dates** (`YYYY-MM-DD`), so no timezone can shift them by a day. A test confirms the weekdays: 5 Oct is a Monday, 5 Sep a Saturday, 14 Jun and 18 Oct Sundays.
- **Event galleries are illustrations for now.** Real photos come from Instagram, which we cannot read automatically. Swap them following the steps in `.cursor/rules/theme.mdc`.
- **The members page** (`/members/`) has the three leaders, a Local Legends space (an invitation until the club names the first legends), and a Strava-style glossary (kudos, fly-by, personal best, Local Legend, segment).
- **Strict type safety**: `tsconfig.json` extends `astro/tsconfigs/strictest` and ESLint uses the strict typescript-eslint set. Turning on `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` found 20 genuine "might be undefined" cases (for example a product with no variants, or a list indexed past its end); they were fixed with types (`NonEmpty`, `requireSite`) rather than assertions. No `any`, no non-null `!`, no unchecked casts.
- **Tablet widths**: adding an 8th nav link made the page overflow sideways by up to 417 px at 768 px and 161 px at 1024 px, which no phone or desktop test could see. The single-row header now starts at 1280 px; e2e checks 768 and 1024 as well.
- **No runtime errors**: an e2e test visits every page and fails on any console error, uncaught exception, failed request or 4xx/5xx response.

## 8. Things we could not do, and why

- **Mine Instagram and Facebook for past questions, posts and event photos.** Both block automated reading, and web searches for the club's events (The Big Run, Steazy Wrexham Run Club, Life in Chester) returned nothing. The FAQ answers and event pages therefore use only facts the club gave us. Please paste real questions, post links and photos to extend them (see section 9).
- **Verify Search Console.** It needs the live URL and a Google account (checklist section 6).
- **Test a real checkout and the Cloudflare prototype end to end.** They need paid-plan payments and credentials the club has not set up yet.
- **A real WhatsApp invite link** was not available, so the Join button is built but hidden until `PUBLIC_WHATSAPP_GROUP_URL` is set.

## 9. Open questions for the club

1. The **WhatsApp group invite link** (`https://chat.whatsapp.com/...`).
2. **5 Oct 2026**: we treated "popcorn, Life in Chester sign making for the Chester Marathon" and "Life in Chester bead making" as **one event on that date**. If bead making was a different day, give us its date and we will split it.
3. **18 Oct 2026 long run**: this date is after today, so it is shown as a coming-up special event, not a past one. Is the year right? What are the start time, place and distance?
4. **Event details and photos** for The Big Run (FYP Gym, Saltney, 5 Sep), the 10k with Wrexham Run Club (The Architect, 14 Jun), the sign making and the long run: distances, headcounts, anything worth saying, and the photos for each gallery.
5. **Football**: is it free? Is there anything to bring or book?
6. What does the **asterisk on 3XL\*** in the size guide mean (the guide image has no footnote)? It is omitted from the site until we know.
7. Is the size guide measurement **chest** (we assumed so) and do 3XL and 4XL have UK sizes?
8. How long does the **Monday run** last, and what time does the social start? Calendar entries default to one hour.
9. Pace groups, **bag drop** and what happens after the run: the home page and FAQs describe them briefly from the original brief. Please confirm or correct the wording.
10. **Leaders**: confirm the wording of each role (we wrote "ASICS FrontRunner" for Emily) and send photos if they are happy to appear. Names for the first **Local Legends**.
11. **Product data in Shopify**: prices, stock settings, descriptions and tidy handles (see section 2).
12. **Real photos** for the hero, gallery and events (see `.cursor/rules/theme.mdc`).
13. **Street address of The Architect**, so the weekly run's location can be a full address in the schema and on the Events page.
14. A **returns policy** for merchandise, so shipping and returns schema can be added.

Resolved: netball is **Tuesdays 7:30pm to 8:30pm**, booked at the SportsKey link above (this replaced the earlier open question about the Back to Netball page's "turn up" wording).
