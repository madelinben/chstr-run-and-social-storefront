# STRUCTURE

Agent bind. Gates + scripts. Prose in `docs/`.

## Docs index

- `docs/ARCHITECTURE.md` — system design, layers, request trace
- `docs/SETUP.md` — local dev
- `docs/DEPLOYMENT_STRATEGY.md` — shipping, rollback
- `docs/CONTEXT.md` — glossary
- `docs/CONFIG.md` — stack, env vars
- `docs/config/astro.md` — Astro stack config
- `docs/environment/cloudflare.md` — Pages deploy, DNS, env
- `docs/environment/shopify.md` — Storefront API, cart, checkout, orders
- `docs/environment/github.md` — PR CLI, CI
- `docs/environment/github-pages.md` — MVP preview hosting on GitHub Pages

## Scripts (root)

| Script | Action |
|---|---|
| `setup` | install + seed `.env.local` + git hooks |
| `setup:hooks` | set `core.hooksPath` to the git root's `.githooks` |
| `install:clean` | wipe `node_modules`, `.astro`, `dist`; reinstall |
| `dev` | Astro dev server, port 4321 |
| `build` | production build |
| `start` | preview the production build |
| `test` | Vitest |
| `test:e2e` | Playwright |
| `lint` / `lint:fix` | ESLint |
| `typecheck` | `astro check` |
| `check` | `check:entry-files` → `lint:fix` → `lint` → `typecheck` |
| `check:site` | SEO + schema.org + performance budgets on the built site (after `build`) |
| `check:entry-files` | fail if `CLAUDE.md` / `AGENTS.md` / `PROJECT_RULES.md` differ |
| `node scripts/mock-storefront.mjs` | local stand-in for the Storefront API on :4400 (e2e uses it) |
| `pipeline` / `predeploy` | branch-base → typecheck → lint → test → build → e2e |

## Routes

| Route | Access | Status |
|---|---|---|
| `/` | public | built |
| `/faqs` | public | built |
| `/waiver` | public | built |
| `/contact` | public | built |
| `/merchandise` | public | built |
| `/merchandise/[handle]` | public | built |
| `/robots.txt`, `/sitemap-index.xml` | public | generated |

## Paths

- product: this folder (app root; code in `src/`). Git root, CI, PR template and hooks: `..`

## Gates before merge

- `pnpm check` green on push (hook + CI + host)
- `pnpm predeploy` green
- sub-plan checkbox synced (if using master/sub-plan SDLC)
- prose stays terse per the doc-writing convention this project picked at intake
