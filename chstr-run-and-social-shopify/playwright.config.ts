import { defineConfig } from '@playwright/test';

// Astro 7 `astro preview` daemonises and exits 0; `sleep` keeps Playwright's server process alive.
// Builds against the local mock Storefront API, so e2e needs no Shopify store.
// E2E_PORT lets e2e run beside a dev server that already holds 4321.
const port = process.env.E2E_PORT ?? '4321';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: `http://localhost:${port}` },
  webServer: [
    { command: 'node scripts/mock-storefront.mjs', url: 'http://localhost:4400', reuseExistingServer: true },
    {
      command: `pnpm build && pnpm exec astro preview --port ${port} && sleep 3600`,
      url: `http://localhost:${port}`,
      reuseExistingServer: true,
      env: { PUBLIC_SHOPIFY_STOREFRONT_URL: 'http://localhost:4400' },
    },
  ],
});
