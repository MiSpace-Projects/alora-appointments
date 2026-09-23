import { expect, test } from '@playwright/test';

test('preserves the complete protected return path', async ({ page }) => {
  await page.goto('/profile?tab=past');
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fprofile%3Ftab%3Dpast$/);
});

test('rejects off-origin callback destinations', async ({ page }) => {
  await page.goto('/login?callbackUrl=https%3A%2F%2Fevil.example');
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
});

test('server rejects weak direct sign-up payloads', async ({ request }) => {
  const response = await request.post('/api/auth/sign-up/email', {
    data: { name: 'A', email: `invalid-${Date.now()}@example.com`, password: 'Password1' },
  });
  expect([400, 403]).toContain(response.status());
});

test('login, protected redirect, session listing, and logout', async ({ page }) => {
  const email = process.env.E2E_AUTH_EMAIL;
  const password = process.env.E2E_AUTH_PASSWORD;
  test.skip(!email || !password, 'E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD are required');

  await page.goto('/login?callbackUrl=%2Fprofile%3Ftab%3Dpast');
  await page.getByPlaceholder('Email address').fill(email ?? '');
  await page.getByPlaceholder('Password').fill(password ?? '');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/profile\?tab=past$/);
  await expect(page.getByRole('heading', { name: 'Security' })).toBeVisible();

  await page.getByRole('button', { name: 'Open account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login\?callbackUrl=/);
});

test('rate limits repeated credential failures', async ({ request }) => {
  test.skip(process.env.E2E_RATE_LIMIT_TEST !== 'true', 'Enable with E2E_RATE_LIMIT_TEST=true');
  const statuses: number[] = [];
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const response = await request.post('/api/auth/sign-in/email', {
      data: { email: 'rate-limit-check@example.com', password: 'invalid password' },
    });
    statuses.push(response.status());
  }
  expect(statuses).toContain(429);
});
