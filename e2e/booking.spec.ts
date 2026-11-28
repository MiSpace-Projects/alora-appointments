import { createHash } from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { createDatabaseAdapter } from '../src/lib/db-adapter';
import { bookingRules } from '../src/app/config/business';

const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(process.env.E2E_DATABASE_URL),
});

const runId = Date.now().toString(36);
const password = `E2e-${runId}-Correct-Horse-Battery-9`;
const ownerEmail = process.env.E2E_OWNER_EMAIL ?? 'owner@e2e.alora.test';
const createdEmails: string[] = [];
const fillerBookingIds: string[] = [];
let ipCounter = 10;

async function signUp(request: APIRequestContext, email: string, name: string): Promise<void> {
  ipCounter += 1;
  const response = await request.post('/api/auth/sign-up/email', {
    headers: { 'x-real-ip': `10.77.${ipCounter}.${Math.floor(Math.random() * 200) + 1}` },
    data: { name, email, password, termsAccepted: true, marketingOptIn: false },
  });
  expect(response.ok(), `sign-up failed with ${response.status()}`).toBeTruthy();
  createdEmails.push(email);
}

async function verify(email: string): Promise<void> {
  await prisma.user.update({ where: { email }, data: { emailVerified: true } });
}

async function signIn(page: Page, email: string, callbackUrl: string): Promise<void> {
  ipCounter += 1;
  await page.setExtraHTTPHeaders({
    'x-real-ip': `10.78.${ipCounter}.${Math.floor(Math.random() * 200) + 1}`,
  });
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, {
    waitUntil: 'networkidle',
  });
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL((url) => url.pathname === callbackUrl);
  await page.waitForLoadState('networkidle');
}

function futureSastSlot(dayOffset: number): string {
  let day = new Date(Date.UTC(2028, 0, 3) + (dayOffset + (Date.now() % 500)) * 86_400_000);
  if (day.getUTCDay() === 0) day = new Date(day.getTime() + 86_400_000);
  return `${day.toISOString().slice(0, 10)}T10:00`;
}

test.beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: ownerEmail } });
});

test.afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { in: [...createdEmails, ownerEmail] } },
    select: { id: true },
  });
  const ids = users.map((user) => user.id);
  await prisma.booking.deleteMany({ where: { id: { in: fillerBookingIds } } });
  await prisma.pointsTransaction.deleteMany({ where: { userId: { in: ids } } });
  await prisma.payment.deleteMany({ where: { booking: { userId: { in: ids } } } });
  await prisma.booking.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test('an unverified customer is asked to verify before booking', async ({ page, request }) => {
  const email = `unverified-${runId}@e2e.alora.test`;
  await signUp(request, email, 'Unverified Customer');
  await signIn(page, email, '/book');
  await expect(page.getByRole('heading', { name: 'Verify your email to book' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Resend verification email' })).toBeVisible();
});

test('a verified customer books, pays, sees it in the profile and cancels with a refund', async ({
  page,
  request,
}) => {
  const email = `customer-${runId}@e2e.alora.test`;
  await signUp(request, email, 'Booking Customer');
  await verify(email);

  const service = await prisma.service.findFirstOrThrow({
    where: { active: true, category: 'Wig Care', priceType: 'FIXED' },
    orderBy: { sortOrder: 'asc' },
  });

  await signIn(page, email, '/book');
  await expect(page.getByRole('heading', { name: 'Book an appointment' })).toBeVisible();
  await page.locator('#familySlug').selectOption('wig-care');
  await page.locator('#serviceId').selectOption(service.id);
  const slot = futureSastSlot(0);
  await page.locator('#startsAt').fill(slot);
  await page.locator('input[value="PAY_NOW"]').check();
  await page.getByRole('button', { name: 'Review booking' }).click();
  await expect(page.getByRole('heading', { name: 'Review your booking' })).toBeVisible();
  await page.getByRole('button', { name: /Confirm & pay/ }).click();

  await expect(page).toHaveURL(/\/book\/payment\/mock\?reference=mock_/);
  await page.locator('button[name="outcome"][value="success"]').click();
  await expect(page.getByRole('heading', { name: 'Payment received' })).toBeVisible();

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const booking = await prisma.booking.findFirstOrThrow({
    where: { userId: user.id },
    include: { payments: true },
  });
  expect(booking.status).toBe('CONFIRMED');
  expect(booking.startsAt.toISOString()).toBe(new Date(`${slot}:00+02:00`).toISOString());
  expect(booking.payments[0]?.status).toBe('SUCCESS');

  await page.goto('/profile');
  await expect(page.getByText('Paid online').first()).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).first().click();
  await page.getByRole('button', { name: 'Yes, cancel' }).click();
  await expect
    .poll(
      async () => (await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).status,
    )
    .toBe('CANCELLED');
  const payment = await prisma.payment.findFirstOrThrow({ where: { bookingId: booking.id } });
  expect(payment.status).toBe('REFUNDED');
  expect(payment.refundedCents).toBe(payment.amountCents);
});

test('a customer cannot take a slot once the salon is fully booked', async ({ page, request }) => {
  const first = `first-${runId}@e2e.alora.test`;
  const second = `second-${runId}@e2e.alora.test`;
  await signUp(request, first, 'First Customer');
  await signUp(request, second, 'Second Customer');
  await verify(first);
  await verify(second);

  const service = await prisma.service.findFirstOrThrow({
    where: { active: true, category: 'Wig Care', priceType: 'FIXED' },
    orderBy: { sortOrder: 'asc' },
  });
  const slot = futureSastSlot(3);

  for (const [email, expectSuccess] of [
    [first, true],
    [second, false],
  ] as const) {
    if (!expectSuccess) {
      for (let filled = 1; filled < bookingRules.concurrentBookings; filled += 1) {
        const filler = await prisma.booking.create({
          data: {
            serviceId: service.id,
            startsAt: new Date(`${slot}:00+02:00`),
            priceCents: service.priceCents,
            pointsAwarded: 0,
            paymentMethod: 'PAY_IN_SALON',
            status: 'CONFIRMED',
          },
        });
        fillerBookingIds.push(filler.id);
      }
    }
    await page.context().clearCookies();
    await signIn(page, email, '/book');
    await page.locator('#familySlug').selectOption('wig-care');
    await page.locator('#serviceId').selectOption(service.id);
    await page.locator('#startsAt').fill(slot);
    await page.locator('input[value="PAY_IN_SALON"]').check();
    await page.getByRole('button', { name: 'Review booking' }).click();
    await page.getByRole('button', { name: 'Confirm booking' }).click();
    if (expectSuccess) {
      await expect(page).toHaveURL(/\/profile/);
    } else {
      await expect(page.getByText('That time is already taken').first()).toBeVisible();
    }
  }
});

test('the owner dashboard needs a verified allowlisted email', async ({ page, request }) => {
  await signUp(request, ownerEmail, 'Salon Owner');
  await page.context().clearCookies();
  await signIn(page, ownerEmail, '/profile');
  await page.goto('/owner', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bookings', exact: true })).toHaveCount(0);

  await verify(ownerEmail);
  await page.goto('/owner', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Bookings', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Customers', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/owner/customers');
  await expect(page.getByRole('heading', { name: 'Customers', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: /^All/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: 'Export marketing list' })).toBeVisible();
});

test('a completed visit invites a testimonial the owner can publish', async ({
  browser,
  page,
  request,
}) => {
  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) await signUp(request, ownerEmail, 'Salon Owner');
  await verify(ownerEmail);

  const email = `testimonial-${runId}@e2e.alora.test`;
  await signUp(request, email, 'Lindiwe Testimonial');
  const customer = await prisma.user.findUniqueOrThrow({ where: { email } });
  const service = await prisma.service.findFirstOrThrow();
  const booking = await prisma.booking.create({
    data: {
      userId: customer.id,
      serviceId: service.id,
      startsAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'CONFIRMED',
      priceCents: 25_000,
      pointsAwarded: 10,
    },
  });

  await page.context().clearCookies();
  await signIn(page, ownerEmail, '/owner');
  await page
    .locator('li', { hasText: 'Lindiwe Testimonial' })
    .getByRole('button', { name: 'Mark done' })
    .click();
  await expect.poll(() => prisma.testimonial.count({ where: { bookingId: booking.id } })).toBe(1);

  const token = `e2e${runId}`.padEnd(43, 'x').slice(0, 43);
  await prisma.testimonial.update({
    where: { bookingId: booking.id },
    data: { tokenHash: createHash('sha256').update(token).digest('hex') },
  });

  const guest = await browser.newPage();
  await guest.goto(`/testimonial/${token}`, { waitUntil: 'networkidle' });
  await expect(guest.getByRole('heading', { name: `How was your ${service.name}?` })).toBeVisible();
  await guest.locator('label', { hasText: '5 stars, Loved it' }).click();
  await expect(guest.getByRole('radio', { name: '5 stars, Loved it' })).toBeChecked();
  await guest
    .getByPlaceholder('What did you love about your visit?')
    .fill('Best appointment I have had all year.');
  await guest.getByRole('button', { name: 'Send testimonial' }).click();
  await expect(guest.getByText('Please agree so we can share your testimonial.')).toBeVisible();
  await expect(guest.getByPlaceholder('What did you love about your visit?')).toHaveValue(
    'Best appointment I have had all year.',
  );
  await guest.getByRole('checkbox').check();
  await guest.getByRole('button', { name: 'Send testimonial' }).click();
  await expect(guest.getByText('Thank you, Lindiwe.')).toBeVisible();
  await guest.reload({ waitUntil: 'networkidle' });
  await expect(guest.getByText('We already have your testimonial for this visit.')).toBeVisible();
  await guest.close();

  await page.getByRole('link', { name: 'Testimonials', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/owner/testimonials');
  const card = page.locator('li', { hasText: 'Best appointment I have had all year.' });
  await expect(card.getByText('Awaiting review')).toBeVisible();
  await expect(card.getByLabel('5 out of 5 stars')).toBeVisible();
  await card.getByRole('button', { name: 'Publish' }).click();
  await expect(card.getByText('Live on site')).toBeVisible();

  const visitor = await browser.newPage();
  await visitor.goto('/', { waitUntil: 'networkidle' });
  const section = visitor.getByRole('region', { name: 'In their words' });
  await expect(section.getByText('Best appointment I have had all year.')).toBeVisible();
  await expect(section.getByText('Lindiwe', { exact: true })).toBeVisible();

  await card.getByRole('button', { name: 'Hide' }).click();
  await expect(card.getByText('Hidden', { exact: true })).toBeVisible();
  await visitor.reload({ waitUntil: 'networkidle' });
  await expect(visitor.getByText('Best appointment I have had all year.')).toHaveCount(0);
  await visitor.close();
});

test('an account without accepted terms must accept them before booking', async ({
  page,
  request,
}) => {
  const email = `social-${runId}@e2e.alora.test`;
  await signUp(request, email, 'Zinhle Social');
  await verify(email);
  await page.context().clearCookies();
  await signIn(page, email, '/profile');

  const user = await prisma.user.update({
    where: { email },
    data: { termsAccepted: false },
  });
  await prisma.consentRecord.deleteMany({ where: { userId: user.id } });

  await page.goto('/book', { waitUntil: 'networkidle' });
  await page.waitForURL((url) => url.pathname === '/welcome');
  expect(new URL(page.url()).searchParams.get('next')).toBe('/book');
  await expect(page.getByRole('heading', { name: 'Welcome, Zinhle' })).toBeVisible();

  await page.getByRole('button', { name: /continue/i }).click();
  await expect(
    page.getByText('Please accept the terms and privacy policy to continue.'),
  ).toBeVisible();

  await page.getByRole('checkbox', { name: /Terms & Booking Policy/ }).check();
  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForURL((url) => url.pathname === '/book');

  const refreshed = await prisma.user.findUniqueOrThrow({ where: { email } });
  expect(refreshed.termsAccepted).toBe(true);
  expect(refreshed.marketingOptIn).toBe(false);
  const kinds = await prisma.consentRecord.findMany({
    where: { userId: user.id },
    select: { kind: true, granted: true },
  });
  expect(kinds).toEqual(
    expect.arrayContaining([
      { kind: 'TERMS', granted: true },
      { kind: 'PRIVACY_NOTICE', granted: true },
      { kind: 'MARKETING', granted: false },
    ]),
  );
});
