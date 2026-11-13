import { expect, test, type APIRequestContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { createDatabaseAdapter } from '../src/lib/db-adapter';

const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(process.env.E2E_DATABASE_URL),
});

const runId = Date.now().toString(36);
const password = `E2e-${runId}-Correct-Horse-Battery-9`;
const createdEmails: string[] = [];
let ipCounter = 0;

function nextIp(prefix: string): string {
  ipCounter += 1;
  return `${prefix}.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}

async function signUp(request: APIRequestContext, email: string) {
  const response = await request.post('/api/auth/sign-up/email', {
    headers: { 'x-real-ip': nextIp('10.91') },
    data: { name: 'Account Tester', email, password, termsAccepted: true, marketingOptIn: false },
  });
  createdEmails.push(email);
  return response;
}

async function signIn(request: APIRequestContext, email: string, secret: string, ip: string) {
  return request.post('/api/auth/sign-in/email', {
    headers: { 'x-real-ip': ip },
    data: { email, password: secret },
  });
}

test.afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  await prisma.$disconnect();
});

test('sign-up looks the same for a new and an existing email', async ({ request }) => {
  const email = `enum-${runId}@e2e.alora.test`;
  const first = await signUp(request, email);
  const second = await signUp(request, email);
  expect(first.status()).toBe(200);
  expect(second.status()).toBe(first.status());
  expect(Object.keys(await second.json()).sort()).toEqual(Object.keys(await first.json()).sort());
});

test('failed sign-ins from other addresses do not lock the owner of the account out', async ({
  request,
}) => {
  const email = `lockout-${runId}@e2e.alora.test`;
  await signUp(request, email);
  await prisma.user.update({ where: { email }, data: { emailVerified: true } });

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await signIn(request, email, 'definitely-the-wrong-password', nextIp('10.92'));
    expect([401, 429]).toContain(response.status());
  }
  const victim = await signIn(request, email, password, '10.93.0.1');
  expect(victim.status()).toBe(200);
});

test('deleting a password account requires the password', async ({ playwright, baseURL }) => {
  const email = `delete-${runId}@e2e.alora.test`;
  const api = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { 'x-real-ip': nextIp('10.94'), origin: baseURL ?? '' },
  });
  await signUp(api, email);
  await prisma.user.update({ where: { email }, data: { emailVerified: true } });
  expect((await api.post('/api/auth/sign-in/email', { data: { email, password } })).status()).toBe(
    200,
  );

  const withoutPassword = await api.post('/api/auth/delete-user', { data: {} });
  expect(withoutPassword.status()).toBe(400);
  const wrongPassword = await api.post('/api/auth/delete-user', {
    data: { password: 'not-the-right-password-123' },
  });
  expect(wrongPassword.status()).toBe(400);
  const rightPassword = await api.post('/api/auth/delete-user', { data: { password } });
  expect(rightPassword.status()).toBe(200);
  await api.dispose();
});

test('browsing does not rate limit the session check for a shared address', async ({ request }) => {
  const statuses: number[] = [];
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await request.get('/api/auth/get-session', {
      headers: { 'x-real-ip': '10.95.0.1' },
    });
    statuses.push(response.status());
  }
  expect(statuses.filter((status) => status === 429)).toHaveLength(0);
});
