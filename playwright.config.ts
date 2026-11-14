import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const E2E_PORT = 3103;
const externalBaseUrl = process.env.E2E_BASE_URL;
const baseURL = externalBaseUrl || `http://localhost:${E2E_PORT}`;
const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL || 'postgresql://postgres:alora_local@localhost:5435/alora';

if (!externalBaseUrl && !/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(e2eDatabaseUrl)) {
  throw new Error('E2E_DATABASE_URL must point at a local database');
}

process.env.E2E_DATABASE_URL = e2eDatabaseUrl;
process.env.E2E_OWNER_EMAIL = process.env.E2E_OWNER_EMAIL || 'owner@e2e.alora.test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  timeout: 90_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] }, testIgnore: /booking\.spec\.ts/ },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `npx next dev -p ${E2E_PORT}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
        env: {
          DATABASE_URL: e2eDatabaseUrl,
          BETTER_AUTH_URL: baseURL,
          NEXT_PUBLIC_BETTER_AUTH_URL: baseURL,
          NEXT_PUBLIC_APP_URL: baseURL,
          BETTER_AUTH_SECRET: 'e2e-only-secret-value-that-is-long-enough-1234',
          AUTH_FINGERPRINT_SECRET: 'ZTJlLW9ubHktZmluZ2VycHJpbnQtc2VjcmV0LTMyYiE=',
          AUTH_IP_ADDRESS_HEADERS: 'x-real-ip',
          PAYMENTS_MOCK: 'true',
          PAYSTACK_SECRET_KEY: '',
          RESEND_API_KEY: '',
          ALORA_OWNER_EMAILS: process.env.E2E_OWNER_EMAIL,
        },
      },
});
