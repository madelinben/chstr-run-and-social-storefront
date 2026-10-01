import { defineConfig } from '@playwright/test';

// Astro 7 `astro preview` daemonises and exits 0; `sleep` keeps Playwright's server process alive.
// Builds against the local mock Storefront API, so e2e needs no Shopify store.
export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:4321' },
  webServer: [
    { command: 'node scripts/mock-storefront.mjs', url: 'http://localhost:4400', reuseExistingServer: true },
    {
      command: 'pnpm build && pnpm start && sleep 3600',
      url: 'http://localhost:4321',
      reuseExistingServer: true,
      env: { PUBLIC_SHOPIFY_STOREFRONT_URL: 'http://localhost:4400' },
    },
  ],
});
