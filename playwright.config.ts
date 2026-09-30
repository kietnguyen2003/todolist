import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:8081', channel: 'chrome' },
  webServer: {
    command: 'python3 -m http.server 8081 --bind 127.0.0.1 --directory dist',
    url: 'http://127.0.0.1:8081',
    reuseExistingServer: !process.env.CI,
  },
});
