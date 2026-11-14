const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DATABASE_URL ? describe : describe.skip;

type Bookings = typeof import('@/lib/data/bookings');
type Payments = typeof import('@/lib/data/payments');
type Db = typeof import('@/lib/prisma');
type Config = typeof import('@/app/config/business');

describeDb('bookings and payments against a real database', () => {
  let bookings: Bookings;
  let payments: Payments;
  let prisma: Db['prisma'];
  let rules: Config['bookingRules'];
  const runId = `t${Date.now().toString(36)}`;
  const userIds: string[] = [];
  let fixedServiceId = '';
  let fromServiceId = '';
  let durationMinutes = 0;
  let dayOffset = 30;

  const nextSlot = () => {
    let slot: Date;
    do {
      dayOffset += 1;
      slot = new Date(Date.UTC(2027, 0, 1, 8, 0) + dayOffset * 24 * 60 * 60_000);
    } while (slot.getUTCDay() === 0);
    return slot;
  };

  const fillSlot = async (slot: Date, count: number) => {
    const ids: string[] = [];
    for (let i = 0; i < count; i += 1) ids.push(await makeUser());
    await Promise.all(ids.map((id) => book(id, slot)));
  };

  const makeUser = async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Test Customer',
        email: `${runId}-${userIds.length}@alora.test`,
        emailVerified: true,
      },
    });
    userIds.push(user.id);
    return user.id;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    ({ prisma } = await import('@/lib/prisma'));
    bookings = await import('@/lib/data/bookings');
    payments = await import('@/lib/data/payments');
    ({ bookingRules: rules } = await import('@/app/config/business'));
    const fixed = await prisma.service.findFirstOrThrow({
      where: { active: true, priceType: 'FIXED', category: { not: null } },
    });
    const from = await prisma.service.findFirstOrThrow({
      where: { active: true, priceType: { not: 'FIXED' }, category: { not: null } },
    });
    fixedServiceId = fixed.id;
    fromServiceId = from.id;
    durationMinutes = fixed.durationMinutes;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.pointsTransaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.payment.deleteMany({ where: { booking: { userId: { in: userIds } } } });
    await prisma.booking.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.securityEvent.deleteMany({
      where: { metadata: { path: ['reference'], string_starts_with: 'mock_' } },
    });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  const book = (
    userId: string,
    startsAt: Date,
    paymentMethod: 'PAY_NOW' | 'PAY_IN_SALON' = 'PAY_IN_SALON',
    serviceId = fixedServiceId,
  ) => bookings.createBooking(userId, { serviceId, startsAt, paymentMethod });

  it('never books more clients into a slot than the salon can take, even all at once', async () => {
    const customers: string[] = [];
    for (let i = 0; i <= rules.concurrentBookings; i += 1) customers.push(await makeUser());
    const slot = nextSlot();
    const results = await Promise.allSettled(customers.map((id) => book(id, slot)));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(rules.concurrentBookings);
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    expect(rejected.map((r) => r.reason.message)).toEqual(['SLOT_UNAVAILABLE']);
  });

  it('blocks overlapping times but allows back to back bookings', async () => {
    const b = await makeUser();
    const slot = nextSlot();
    await fillSlot(slot, rules.concurrentBookings);
    await expect(book(b, new Date(slot.getTime() + 15 * 60_000))).rejects.toThrow(
      'SLOT_UNAVAILABLE',
    );
    await expect(
      book(b, new Date(slot.getTime() + durationMinutes * 60_000)),
    ).resolves.toBeDefined();
  });

  it('enforces opening hours when they are configured', async () => {
    const a = await makeUser();
    const previous = rules.openingHours;
    rules.openingHours = { 1: { open: '09:00', close: '17:00' } };
    try {
      await expect(book(a, new Date('2027-03-01T01:00:00.000Z'))).rejects.toThrow(
        'OUTSIDE_OPENING_HOURS',
      );
      await expect(book(a, new Date('2027-03-07T08:00:00.000Z'))).rejects.toThrow(
        'OUTSIDE_OPENING_HOURS',
      );
    } finally {
      rules.openingHours = previous;
    }
  });

  it('caps upcoming bookings per customer', async () => {
    const a = await makeUser();
    for (let i = 0; i < rules.maxUpcomingPerCustomer; i += 1) await book(a, nextSlot());
    await expect(book(a, nextSlot())).rejects.toThrow('TOO_MANY_UPCOMING_BOOKINGS');
  });

  it('awards loyalty points once even when completed twice at the same time', async () => {
    const a = await makeUser();
    const booking = await book(a, nextSlot());
    const results = await Promise.allSettled([
      bookings.completeBooking(booking.id),
      bookings.completeBooking(booking.id),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await prisma.pointsTransaction.count({ where: { bookingId: booking.id } })).toBe(
      booking.pointsAwarded > 0 ? 1 : 0,
    );
  });

  it('refuses online payment for consultation priced services', async () => {
    const a = await makeUser();
    const booking = await book(a, nextSlot(), 'PAY_IN_SALON', fromServiceId);
    await expect(
      payments.startBookingPayment(a, 'x@alora.test', booking.id, 'http://localhost/back'),
    ).rejects.toThrow('ONLINE_PAYMENT_NOT_ALLOWED');
  });

  const paidBooking = async () => {
    const a = await makeUser();
    const booking = await book(a, nextSlot(), 'PAY_NOW');
    const { reference } = await payments.startBookingPayment(
      a,
      'x@alora.test',
      booking.id,
      'http://localhost/back',
    );
    await expect(payments.settleMockPayment(reference, 'success')).resolves.toBe('PAID');
    return { userId: a, bookingId: booking.id, reference };
  };

  it('refunds a late cancellation only once when cancelled twice at the same time', async () => {
    const { userId, bookingId, reference } = await paidBooking();
    const results = await Promise.allSettled([
      payments.cancelBookingWithRefund(userId, bookingId),
      payments.cancelBookingWithRefund(userId, bookingId),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { reference } });
    expect(payment.refundedCents).toBe(payment.amountCents);
    expect(payment.pendingRefundCents).toBe(0);
    expect(payment.status).toBe('REFUNDED');
  });

  it('refunds in full when the salon cancels a paid booking', async () => {
    const { bookingId, reference } = await paidBooking();
    const result = await payments.cancelBookingAsOwnerWithRefund(bookingId);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { reference } });
    expect(result.refundStatus).toBe('REQUESTED');
    expect(payment.status).toBe('REFUNDED');
    expect(payment.refundedCents).toBe(payment.amountCents);
  });

  it('refunds a payment that completes after the booking was cancelled', async () => {
    const a = await makeUser();
    const booking = await book(a, nextSlot(), 'PAY_NOW');
    const { reference } = await payments.startBookingPayment(
      a,
      'x@alora.test',
      booking.id,
      'http://localhost/back',
    );
    await payments.cancelBookingWithRefund(a, booking.id);
    await expect(payments.settleMockPayment(reference, 'success')).resolves.toBe('REFUNDED');
    const payment = await prisma.payment.findUniqueOrThrow({ where: { reference } });
    expect(payment.status).toBe('REFUNDED');
  });

  it('refunds a second payment for a booking that is already paid', async () => {
    const { userId, bookingId } = await paidBooking();
    const second = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        reference: `mock_${bookingId}_second`,
        amountCents: 10_000,
        status: 'PENDING',
      },
    });
    await expect(payments.settleMockPayment(second.reference, 'success')).resolves.toBe('REFUNDED');
    const settled = await prisma.payment.findUniqueOrThrow({ where: { id: second.id } });
    expect(settled.status).toBe('REFUNDED');
  });

  it('applies a replayed refund webhook only once', async () => {
    const { reference } = await paidBooking();
    const payment = await prisma.payment.findUniqueOrThrow({ where: { reference } });
    await prisma.payment.update({ where: { id: payment.id }, data: { pendingRefundCents: 5_000 } });
    const event = { transactionReference: reference, amountCents: 5_000, status: 'processed' };
    await payments.recordProviderRefund(event);
    await payments.recordProviderRefund(event);
    const after = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(after.refundedCents).toBe(5_000);
    expect(after.pendingRefundCents).toBe(0);
  });
});

export {};
