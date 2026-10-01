import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Build-time origin for canonical URLs, OG tags and the sitemap. Set SITE_ORIGIN in CI / the host build environment.
const SITE_ORIGIN = process.env.SITE_ORIGIN ?? 'http://localhost:4321';
// Pages that must never be indexed or listed in the sitemap (seo.mdc).
const NOT_INDEXED = ['/404'];

// Fully static. Shopify Storefront API is called at build time (products) and from the browser (cart).
export default defineConfig({
  site: SITE_ORIGIN,
  output: 'static',
  integrations: [react(), sitemap({ filter: (page) => !NOT_INDEXED.some((path) => page.includes(path)) })],
  vite: {
    plugins: [tailwindcss()],
    server: { port: 4321, strictPort: true },
  },
});
