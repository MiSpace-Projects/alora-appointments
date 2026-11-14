const sendAuthEmail = jest.fn().mockResolvedValue(true);
const findUnique = jest.fn();

jest.mock('@/lib/email', () => ({
  ...jest.requireActual('@/lib/email'),
  sendAuthEmail: (...args: unknown[]) => sendAuthEmail(...args),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: { booking: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));

const booking = {
  id: 'cmbooking000000abc123',
  startsAt: new Date('2026-12-03T08:00:00.000Z'),
  priceCents: 25_000,
  paymentMethod: 'PAY_IN_SALON',
  paidAt: null,
  notes: 'Allergic to shampoo',
  user: { name: 'Mzwakhe Mokhatla', email: 'customer@example.com' },
  service: {
    name: 'Advanced Customization',
    slug: 'wig-customization-advanced',
    durationMinutes: 120,
    priceType: 'FIXED',
    priceMaxCents: null,
  },
};

describe('booking notifications', () => {
  const original = process.env.ALORA_OWNER_EMAILS;

  beforeEach(() => {
    findUnique.mockResolvedValue(booking);
    sendAuthEmail.mockClear();
  });

  afterEach(() => {
    process.env.ALORA_OWNER_EMAILS = original;
  });

  it('emails every owner with a dashboard link', async () => {
    process.env.ALORA_OWNER_EMAILS = 'Owner@Example.com, second@example.com';
    const { notifyOwnerOfNewBooking } = await import('@/lib/notifications');
    await notifyOwnerOfNewBooking(booking.id);
    expect(sendAuthEmail.mock.calls.map(([input]) => input.to)).toEqual([
      'owner@example.com',
      'second@example.com',
    ]);
    const [input] = sendAuthEmail.mock.calls[0];
    expect(input.kind).toBe('BOOKING_CREATED_OWNER');
    expect(input.html).toContain('/owner"');
    expect(input.html).toContain('Allergic to shampoo');
  });

  it('sends nothing to owners when none are configured', async () => {
    process.env.ALORA_OWNER_EMAILS = '';
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { notifyOwnerOfNewBooking } = await import('@/lib/notifications');
    await notifyOwnerOfNewBooking(booking.id);
    expect(sendAuthEmail).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('sends the customer a booking received email with a calendar link and ics file', async () => {
    const { notifyCustomerBookingReceived } = await import('@/lib/notifications');
    await notifyCustomerBookingReceived(booking.id);
    const [input] = sendAuthEmail.mock.calls[0];
    expect(input.to).toBe('customer@example.com');
    expect(input.kind).toBe('BOOKING_RECEIVED_CUSTOMER');
    expect(input.html).toContain('calendar.google.com/calendar/render');
    expect(input.attachments[0].filename).toBe('alora-booking.ics');
    expect(input.attachments[0].content.toString()).toContain('DTSTART:20261203T080000Z');
  });

  it('skips the email when the booking has no customer account', async () => {
    findUnique.mockResolvedValue({ ...booking, user: null });
    const { notifyCustomerBookingConfirmed } = await import('@/lib/notifications');
    await notifyCustomerBookingConfirmed(booking.id);
    expect(sendAuthEmail).not.toHaveBeenCalled();
  });
});

export {};
