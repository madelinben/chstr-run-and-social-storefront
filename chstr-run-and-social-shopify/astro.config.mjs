import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Build-time origin for canonical URLs, OG tags and the sitemap. Set SITE_ORIGIN in CI / the host build environment.
const SITE_ORIGIN = process.env.SITE_ORIGIN ?? 'http://localhost:4321';
// Sub-path hosting (GitHub Pages project sites serve from /<repo>/). Leave unset at a domain root.
const BASE_PATH = process.env.BASE_PATH || undefined;
// Prototype previews are kept out of search engines: no sitemap, noindex, robots Disallow (see PageSeo).
const NOINDEX = process.env.PUBLIC_SITE_NOINDEX === '1';
// Pages that must never be indexed or listed in the sitemap (seo.mdc).
const NOT_INDEXED = ['/404', '/admin'];

// Fully static. Shopify Storefront API is called at build time (products) and from the browser (cart).
export default defineConfig({
  site: SITE_ORIGIN,
  base: BASE_PATH,
  output: 'static',
  integrations: NOINDEX ? [react()] : [react(), sitemap({ filter: (page) => !NOT_INDEXED.some((path) => page.includes(path)) })],
  vite: {
    plugins: [tailwindcss()],
    server: { port: 4321, strictPort: true },
  },
});
