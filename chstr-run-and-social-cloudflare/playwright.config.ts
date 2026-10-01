import { defineConfig } from '@playwright/test';

// Astro 7 `astro preview` daemonises and exits 0; `sleep` keeps Playwright's server process alive.
export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:4321' },
  webServer: { command: 'pnpm build && pnpm start && sleep 3600', url: 'http://localhost:4321', reuseExistingServer: true },
});
