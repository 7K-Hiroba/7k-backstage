import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
  },
  webServer: {
    command:
      'WDS_SOCKET_PORT=0 DISABLE_ESLINT_PLUGIN=true MOCK_MODE=true yarn dev',
    env: {
      // Newer guest-auth providers require this when NODE_ENV is not
      // "development" (some e2e runners set NODE_ENV=test).
      APP_CONFIG_auth_providers_guest_dangerouslyAllowOutsideDevelopment:
        'true',
      // Disable the CAIPE Agent Forge assistant during e2e so it does not try
      // to reach an unavailable CAIPE backend and pollute the console.
      APP_CONFIG_features_agentForge: 'false',
    },
    port: 3000,
    timeout: 180000,
    reuseExistingServer: true,
  },
});
