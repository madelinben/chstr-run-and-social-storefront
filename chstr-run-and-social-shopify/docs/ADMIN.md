# Site admin

`/admin/` is a form-based editor for all site content except Shopify products (those stay in Shopify admin). Saving makes one GitHub commit; the deploy workflow then rebuilds and publishes the site (about two minutes).

## What it edits

| Section | File | Notes |
|---------|------|-------|
| Contact and links | `src/content/site/settings.json` | WhatsApp group link, WhatsApp number, email, Instagram, Facebook, waiver link, motto, route note, lights notice |
| Weekly sessions | `src/content/site/sessions.json` | Day, time, venue, address, booking link, copy for run, football and netball |
| Special events | `src/content/site/events.json` | One-off events. They move to Past Events by themselves once their date passes |
| Members | `src/content/site/members.json` | The people to look for, Local Legends, Strava glossary |
| Home page | `src/content/site/home.json` | Three Monday steps, activity cards, scrolling words |
| Pictures | `src/content/site/pictures.json` + `src/assets/uploads/*.webp` | Photos are resized to 1600 px WebP in the browser before upload |
| FAQs | `src/content/faqs/*.md` | Question, answer, position |

Empty contact fields hide their buttons. Empty Local Legends shows the invitation instead.

## How content is protected from mistakes

- `src/data/Content/schemas.ts` is the single definition of every file. The admin checks a save against it, and the build checks the same files again. A bad edit (broken link, missing picture, duplicate web address) is refused with a plain message in the admin, and fails the build if it arrives some other way, so a broken page is never published.
- `src/data/Content/validate-content.ts` checks across files: every picture an event or card uses must exist, at least one picture must be marked for the home collage and the gallery.
- A save is one commit, so the site never builds from half an edit. Revert a bad edit with `git revert` on that commit.

## Turning it on

1. Repo variable `ADMIN_ENABLED` = `1` (Settings, Secrets and variables, Actions, Variables). The deploy workflow passes the repository, branch and content folder itself. Without this variable `/admin/` is built as a one-line "switched off" page.
2. Create a **fine-grained personal access token** (GitHub, Settings, Developer settings): this repository only, permission **Contents: Read and write**, short expiry. Nothing else.
3. Open `/admin/`, paste the token, sign in. The token lives in memory in that tab only; closing the tab forgets it. Do not paste it into chat or commit it.

Anyone with a token like that can already change the repository, so the admin adds no new power. It only makes the allowed changes easy.

## Protection today and later

Today:
- `PUBLIC_ADMIN_ENABLED` flag (off by default), `noindex, nofollow`, `Disallow: /admin` in robots.txt, not in the sitemap.
- A Content-Security-Policy meta tag on the page: scripts and styles from this site only, connections only to `https://api.github.com`, no forms, no referrer.
- The GitHub token is the lock: without a token that can write to the repository, the page can read nothing private and save nothing.
- `scripts/check-site-quality.mjs` fails the build if the admin loses its noindex or CSP, or loads a third-party script.

Later (the seams are ready):
- `AdminAuth` and `ContentStore` in `src/features/content-admin/models/content-store.ts` are the two interfaces the screens use. To add Google sign-in or Cloudflare Access, implement `AdminAuth` (an Authorization header from your login) and, if saves move behind a worker, `ContentStore`. No screen changes.
- Static hosting cannot hide a page's HTML. Real protection of the page itself needs a host in front (Cloudflare Access on `/admin/*`, or the Cloudflare app). The page contains no secrets, so that is hardening, not a fix.
- Add the admin hostname to the CSP `connect-src` when a worker is introduced.

## Adding a field

1. Add it to the schema in `schemas.ts` and to the JSON file.
2. Read it where it is shown (`src/data/Content/settings.ts` or the matching module).
3. The form shows it automatically: the editor builds inputs from the shape of the data. Add help text, a short choice list or a blank row template in `src/features/content-admin/utilities/blank-items.ts` if needed.

## Tests

- Unit: `src/features/content-admin/utilities/tests/` (GitHub commit sequence, FAQ files, draft validation).
- E2E: `e2e/admin.spec.ts` runs the real admin page against a fake GitHub API (nothing real is touched), checks one-commit saves, refusal of bad input, axe on every section.
