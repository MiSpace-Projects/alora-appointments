import { createDecipheriv, createHmac, randomUUID } from 'node:crypto';
import { expect, request, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import { getEmailOutboxKey } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { fingerprint } from '@/lib/security-events';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags: string[];
}

const runId = randomUUID();
const email = `auth-security-${runId}@example.com`;
const originalPassword = `alora original ${runId}`;
const replacementPassword = `alora replacement ${runId}`;
const recipientHash = fingerprint(email);
const ipOctet = (Number.parseInt(runId.slice(0, 2), 16) % 200) + 20;
const rateLimitIp = `192.0.2.${((ipOctet + 1) % 200) + 20}`;
const testStartedAt = new Date(Date.now() - 1_000);
const verificationIds = new Set<string>();
let userId: string | null = null;

function decodeEmailPayload(envelope: string): EmailPayload {
  const [version, iv, tag, ciphertext] = envelope.split('.');
  if (version !== 'v1' || !iv || !tag || !ciphertext) {
    throw new Error('Unexpected email outbox envelope');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEmailOutboxKey(),
    Buffer.from(iv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
  const parsed = JSON.parse(plaintext) as unknown;
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('to' in parsed) ||
    !('text' in parsed) ||
    typeof parsed.to !== 'string' ||
    typeof parsed.text !== 'string'
  ) {
    throw new Error('Unexpected email payload');
  }
  return parsed as EmailPayload;
}

function firstUrl(text: string): URL {
  const match = text.match(/https?:\/\/\S+/);
  if (!match) throw new Error('Email did not contain an action URL');
  return new URL(match[0]);
}

function decodeBase32(value: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const character of value.toUpperCase().replace(/=+$/g, '')) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error('Invalid TOTP secret');
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
}

function totp(secret: string, timestamp = Date.now()): string {
  const counter = BigInt(Math.floor(timestamp / 30_000));
  const counterBytes = Buffer.alloc(8);
  counterBytes.writeBigUInt64BE(counter);
  const digest = createHmac('sha1', decodeBase32(secret)).update(counterBytes).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

async function objectBody(response: APIResponse): Promise<Record<string, unknown>> {
  const body = (await response.json()) as unknown;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new Error(`Expected an object response, received HTTP ${response.status()}`);
  }
  return body as Record<string, unknown>;
}

async function latestEmail(kind: string): Promise<EmailPayload> {
  const row = await prisma.emailOutbox.findFirst({
    where: { recipientHash, kind },
    orderBy: { createdAt: 'desc' },
  });
  expect(row?.encryptedPayload).toBeTruthy();
  expect(row?.encryptedPayload).not.toContain(email);
  expect(row?.encryptedPayload).not.toContain('http');
  return decodeEmailPayload(row?.encryptedPayload ?? '');
}

async function expectTokenNotStoredInPlaintext(token: string): Promise<void> {
  const records = await prisma.verification.findMany({
    where: { createdAt: { gte: testStartedAt } },
  });
  expect(records.length).toBeGreaterThan(0);
  for (const record of records) {
    verificationIds.add(record.id);
    expect(record.identifier).not.toContain(token);
    expect(record.value).not.toContain(token);
  }
}

async function signedInContext(baseURL: string, password: string): Promise<APIRequestContext> {
  const trustedOrigin = process.env.BETTER_AUTH_URL ?? baseURL;
  const context = await request.newContext({
    baseURL,
    extraHTTPHeaders: {
      origin: trustedOrigin,
      'x-real-ip': `198.51.100.${Math.floor(Math.random() * 100) + 1}`,
    },
  });
  const response = await context.post('/api/auth/sign-in/email', {
    data: { email, password },
  });
  expect(response.ok()).toBe(true);
  return context;
}

test.describe.serial('complete authentication security lifecycle', () => {
  test.setTimeout(120_000);

  test.afterAll(async () => {
    const knownUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    const ownedUserId = userId ?? knownUser?.id;
    await prisma.emailOutbox.deleteMany({ where: { recipientHash } });
    await prisma.rateLimit.deleteMany({
      where: {
        OR: [{ key: { contains: recipientHash } }, { key: { contains: rateLimitIp } }],
      },
    });
    if (verificationIds.size > 0) {
      await prisma.verification.deleteMany({ where: { id: { in: [...verificationIds] } } });
    }
    await prisma.securityEvent.deleteMany({
      where: {
        OR: [{ actorHash: recipientHash }, ...(ownedUserId ? [{ userId: ownedUserId }] : [])],
      },
    });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  test('registration, verification, reset, session revocation, MFA, and logout', async ({
    baseURL,
    page,
  }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required');
    const anonymous = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        origin: process.env.BETTER_AUTH_URL ?? baseURL,
        'x-real-ip': `198.51.100.${ipOctet}`,
      },
    });

    const weakSignup = await anonymous.post('/api/auth/sign-up/email', {
      data: { name: 'A', email: `invalid-${runId}@example.com`, password: 'short password' },
    });
    expect(weakSignup.status()).toBe(400);

    const signup = await anonymous.post('/api/auth/sign-up/email', {
      data: { name: 'Auth Security Test', email, password: originalPassword },
    });
    expect(signup.ok()).toBe(true);

    const createdUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true, sessions: true },
    });
    expect(createdUser?.emailVerified).toBe(false);
    expect(createdUser?.sessions).toHaveLength(0);
    expect(createdUser?.accounts[0]?.password).toMatch(/^\$argon2id\$/);
    userId = createdUser?.id ?? null;

    const unverifiedContext = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        origin: process.env.BETTER_AUTH_URL ?? baseURL,
        'x-real-ip': `198.51.100.${ipOctet}`,
      },
    });
    try {
      const unverifiedLogin = await unverifiedContext.post('/api/auth/sign-in/email', {
        data: { email, password: originalPassword },
      });
      expect(unverifiedLogin.ok()).toBe(true);
      const unverifiedSession = await unverifiedContext.get('/api/auth/get-session');
      expect(await objectBody(unverifiedSession)).toMatchObject({
        user: { email, emailVerified: false },
      });
    } finally {
      await unverifiedContext.dispose();
    }

    const verification = await latestEmail('EMAIL_VERIFICATION');
    expect(verification.to).toBe(email);
    const verificationUrl = firstUrl(verification.text);
    const verificationToken = verificationUrl.searchParams.get('token');
    expect(verificationToken).toBeTruthy();

    const verifyResponse = await anonymous.get(
      `${verificationUrl.pathname}${verificationUrl.search}`,
    );
    expect(verifyResponse.ok()).toBe(true);
    expect(
      await prisma.user.findUnique({ where: { email }, select: { emailVerified: true } }),
    ).toEqual({ emailVerified: true });

    const activeSession = await signedInContext(baseURL, originalPassword);
    const sessionBeforeReset = await activeSession.get('/api/auth/get-session');
    expect(sessionBeforeReset.ok()).toBe(true);
    expect(await objectBody(sessionBeforeReset)).toHaveProperty('session');

    const recovery = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        origin: process.env.BETTER_AUTH_URL ?? baseURL,
        'x-real-ip': `203.0.113.${ipOctet}`,
      },
    });
    const trustedAuthOrigin = process.env.BETTER_AUTH_URL ?? baseURL;
    const resetRequest = await recovery.post('/api/auth/request-password-reset', {
      data: { email, redirectTo: `${trustedAuthOrigin}/reset-password` },
    });
    expect(resetRequest.ok()).toBe(true);
    const resetEmail = await latestEmail('PASSWORD_RESET');
    const resetActionUrl = firstUrl(resetEmail.text);
    const resetToken = resetActionUrl.pathname.split('/').pop();
    expect(resetToken).toBeTruthy();
    await expectTokenNotStoredInPlaintext(resetToken ?? '');

    const resetRedirect = await recovery.get(`${resetActionUrl.pathname}${resetActionUrl.search}`, {
      maxRedirects: 0,
    });
    expect(resetRedirect.status()).toBe(302);
    const resetLocation = new URL(resetRedirect.headers().location ?? '', baseURL);
    expect(resetLocation.pathname).toBe('/reset-password');
    expect(resetLocation.searchParams.get('token')).toBe(resetToken);

    const reset = await recovery.post('/api/auth/reset-password', {
      data: { token: resetToken, newPassword: replacementPassword },
    });
    expect(reset.ok()).toBe(true);
    await latestEmail('PASSWORD_CHANGED');

    const revokedSession = await activeSession.get('/api/auth/get-session');
    expect(await revokedSession.json()).toBeNull();
    const oldPasswordLogin = await recovery.post('/api/auth/sign-in/email', {
      data: { email, password: originalPassword },
    });
    expect(oldPasswordLogin.ok()).toBe(false);

    const loginPage = await page.goto('/login?callbackUrl=%2Fprofile%3Ftab%3Dpast');
    const csp = loginPage?.headers()['content-security-policy'] ?? '';
    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(loginPage?.headers()['content-security-policy-report-only']).toBeUndefined();
    await page.getByPlaceholder('Email address').fill(email);
    await page.getByPlaceholder('Password').fill(replacementPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/profile\?tab=past$/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Security' })).toBeVisible();
    await page.goto('/');
    await page.getByRole('button', { name: 'Open account menu' }).click();
    const signOutResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/auth/sign-out',
    );
    const signedOutNavigationPromise = page.waitForEvent(
      'framenavigated',
      (frame) => frame === page.mainFrame() && new URL(frame.url()).pathname === '/',
    );
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    expect((await signOutResponsePromise).ok()).toBe(true);
    await signedOutNavigationPromise;
    await page.goto('/profile?tab=past');
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fprofile%3Ftab%3Dpast$/, {
      timeout: 20_000,
    });

    const securedSession = await signedInContext(baseURL, replacementPassword);
    const enable = await securedSession.post('/api/auth/two-factor/enable', {
      data: { password: replacementPassword },
    });
    expect(enable.ok()).toBe(true);
    const enrollment = await objectBody(enable);
    expect(typeof enrollment.totpURI).toBe('string');
    expect(Array.isArray(enrollment.backupCodes)).toBe(true);
    const backupCodes = enrollment.backupCodes;
    if (!Array.isArray(backupCodes) || !backupCodes.every((code) => typeof code === 'string')) {
      throw new Error('Two-factor enrollment did not return backup codes');
    }
    const totpUri = new URL(String(enrollment.totpURI));
    const secret = totpUri.searchParams.get('secret');
    expect(secret).toBeTruthy();

    const verifyTotp = await securedSession.post('/api/auth/two-factor/verify-totp', {
      data: { code: totp(secret ?? ''), trustDevice: false },
    });
    expect(verifyTotp.ok()).toBe(true);
    const storedFactor = await prisma.twoFactor.findFirst({ where: { userId: userId ?? '' } });
    expect(storedFactor?.verified).toBe(true);
    expect(storedFactor?.secret).not.toBe(secret);
    expect(storedFactor?.backupCodes).not.toContain(backupCodes[0]);

    const signOut = await securedSession.post('/api/auth/sign-out', { data: {} });
    expect(signOut.ok()).toBe(true);
    expect(await (await securedSession.get('/api/auth/get-session')).json()).toBeNull();

    const challenged = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        origin: process.env.BETTER_AUTH_URL ?? baseURL,
        'x-real-ip': `192.0.2.${ipOctet}`,
      },
    });
    const challengedLogin = await challenged.post('/api/auth/sign-in/email', {
      data: { email, password: replacementPassword },
    });
    const challengedBody = await objectBody(challengedLogin);
    expect(challengedBody.twoFactorRedirect).toBe(true);
    expect(await (await challenged.get('/api/auth/get-session')).json()).toBeNull();

    const completeChallenge = await challenged.post('/api/auth/two-factor/verify-totp', {
      data: { code: totp(secret ?? ''), trustDevice: false },
    });
    expect(completeChallenge.ok()).toBe(true);
    expect(await objectBody(await challenged.get('/api/auth/get-session'))).toHaveProperty(
      'session',
    );
    expect((await challenged.post('/api/auth/sign-out', { data: {} })).ok()).toBe(true);

    const limited = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        origin: process.env.BETTER_AUTH_URL ?? baseURL,
        'x-real-ip': rateLimitIp,
      },
    });
    const statuses: number[] = [];
    let retryAfter: string | undefined;
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const response = await limited.post('/api/auth/sign-in/email', {
        data: { email, password: `incorrect ${runId}` },
      });
      statuses.push(response.status());
      if (response.status() === 429) retryAfter = response.headers()['retry-after'];
    }
    expect(statuses).toContain(429);
    expect(Number(retryAfter)).toBeGreaterThan(0);
    await limited.dispose();

    await anonymous.dispose();
    await activeSession.dispose();
    await recovery.dispose();
    await securedSession.dispose();
    await challenged.dispose();
  });
});
