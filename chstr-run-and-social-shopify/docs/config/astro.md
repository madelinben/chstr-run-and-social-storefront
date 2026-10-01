# Config — Astro

Applies when root `package.json` lists `astro`. Record in `docs/CONFIG.md` § Stack (`STACK = astro`).

| Item | Value |
|---|---|
| Routes | `src/pages/` (file-based) |
| Dev / E2E port | `4321` (`strictPort`; `playwright.config.ts` must match) |
| Ship gate | `pnpm predeploy` (`pipeline` alias) |
| Output | `static`, no adapter |
| Server mutation | none (Shopify owns writes; cart mutations run in the browser via `data/Cart/`) |
| Server read | `get*Server.ts` called from `.astro` frontmatter at build time |
| Client read | `get*Client.ts` from React islands (live price/stock, cart) |
| Interactive UI | React islands in `features/*/views/components/` (`client:visible` / `client:idle`) |
| Animation | CSS transitions + `IntersectionObserver` (`features/site-shell/utilities/scroll-reveal.ts`) |
| Images | `astro:assets` with explicit `width` + `height`; Shopify CDN via `shopify-image-url` where it applies (`performance.mdc`) |
| SEO | `PageLayout` → `PageSeo`; site origin from `SITE_ORIGIN`; `pnpm check:site` (`seo.mdc`) |
| Env | `PUBLIC_*` browser-exposed; everything else server-only (`astro:env` or `import.meta.env`) |

## Review checks

- Ship command is `predeploy`; CI runs typecheck → lint → test → build
- No server code (`prerender = false`, API routes)
- No `client:load` without a reason
- `docs/CONFIG.md` exists, `STACK = astro`

## Not for this stack

`app/`, Server Actions, `next/image`, `createServerFn`, `next.config.ts`.
