import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Build-time origin for canonical URLs, OG tags and the sitemap. Set SITE_ORIGIN in CI / the host build environment.
const SITE_ORIGIN = process.env.SITE_ORIGIN ?? 'http://localhost:4321';
// Pages that must never be indexed or listed in the sitemap (seo.mdc).
const NOT_INDEXED = ['/merchandise/thanks/', '/admin/', '/auth/', '/keystatic/'];

// Static pages; only src/pages/api/*, admin and the Keystatic routes opt out with `export const prerender = false`.
export default defineConfig({
  site: SITE_ORIGIN,
  output: 'static',
  adapter: cloudflare(),
  integrations: [react(), keystatic(), sitemap({ filter: (page) => !NOT_INDEXED.some((path) => page.includes(path)) })],
  vite: {
    plugins: [tailwindcss()],
    // Keystatic ships CommonJS; workerd's module runner needs it pre-bundled.
    environments: {
      ssr: {
        optimizeDeps: {
          include: ['@keystatic/astro > @keystatic/core', '@keystatic/core/ui', '@keystatic/core/api/generic', 'react', 'react-dom', 'react/jsx-runtime', 'react-dom/server'],
        },
      },
    },
    server: { port: 4321, strictPort: true },
  },
});
