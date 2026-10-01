# STRUCTURE

Agent bind. Gates + scripts. Prose in `docs/`.

## Docs index

- `docs/ARCHITECTURE.md` — system design, layers, request trace
- `docs/SETUP.md` — local dev
- `docs/DEPLOYMENT_STRATEGY.md` — shipping, rollback
- `docs/AUTH.md` — staff Google sign-in, setup, security
- `docs/PAYMENTS.md` — payment provider seam, how to add one
- `docs/CONTEXT.md` — glossary
- `docs/CONFIG.md` — stack, env vars
- `docs/config/astro.md` — Astro stack config
- `docs/environment/cloudflare.md` — Pages deploy, DNS, env
- `docs/environment/cloudflare-data.md` — D1, content collections, admin
- `docs/environment/github.md` — PR CLI, CI

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
| `db:migrate:local` / `db:migrate` | apply D1 migrations (local / remote) |
| `lint` / `lint:fix` | ESLint |
| `typecheck` | `astro check` |
| `check` | `check:entry-files` → `lint:fix` → `lint` → `typecheck` |
| `check:site` | SEO + schema.org + performance budgets on the built site (after `build`) |
| `check:entry-files` | fail if `CLAUDE.md` / `AGENTS.md` / `PROJECT_RULES.md` differ |
| `pipeline` / `predeploy` | branch-base → typecheck → lint → test → build → e2e |

## Routes

| Route | Access | Status |
|---|---|---|
| `/` | public | placeholder page exists |
| `/faqs` | public | planned |
| `/waiver` | public | planned |
| `/contact` | public | planned |
| `/merchandise` | public | planned |
| `/api/checkout` | public (POST) | planned |
| `/api/payments/webhook/[provider]` | provider signature | built |
| `/admin/orders` | Google sign-in, `ADMIN_EMAILS` | built |
| `/keystatic`, `/api/keystatic/*` | Google sign-in, then Keystatic GitHub | built (write path unverified) |
| `/auth/login`, `/auth/callback`, `/auth/logout` | public | built |
| `/keystatic` | GitHub login (staff) | planned |

## Paths

- product: this folder (app root; code in `src/`). Git root, CI, PR template and hooks: `..`

## Gates before merge

- `pnpm check` green on push (hook + CI + host)
- `pnpm predeploy` green
- sub-plan checkbox synced (if using master/sub-plan SDLC)
- prose stays terse per the doc-writing convention this project picked at intake
