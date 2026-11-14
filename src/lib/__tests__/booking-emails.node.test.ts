import {
  bookingCancelledCustomerEmail,
  bookingConfirmedCustomerEmail,
  bookingReceivedCustomerEmail,
  newBookingOwnerEmail,
  type BookingEmailContext,
} from '@/lib/booking-emails';

const context: BookingEmailContext = {
  bookingId: 'cmbooking000000abc123',
  customerName: 'Thandi <script>Mokoena',
  customerEmail: 'thandi@example.com',
  serviceName: 'Gel-X Short (plain)',
  serviceSlug: 'nails-gelx-short',
  startsAt: new Date('2026-12-03T08:00:00.000Z'),
  durationMinutes: 90,
  price: 'R250',
  paymentMethod: 'PAY_IN_SALON',
  paid: false,
  notes: 'Prefers a nude shade',
};

describe('booking emails', () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;
  beforeAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.alorastudios.co.za';
  });
  afterAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it('shows the visit in South African time with the end time', () => {
    const email = bookingReceivedCustomerEmail(context);
    expect(email.html).toContain('3 December 2026');
    expect(email.html).toContain('10:00 to 11:30');
    expect(email.text).toContain('Thursday, 3 December 2026');
  });

  it('escapes customer supplied text', () => {
    const email = newBookingOwnerEmail(context);
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });

  it('links the owner to the dashboard and the customer to calendar and profile', () => {
    expect(newBookingOwnerEmail(context).html).toContain(
      'href="https://www.alorastudios.co.za/owner"',
    );
    const confirmed = bookingConfirmedCustomerEmail(context);
    expect(confirmed.html).toContain('calendar.google.com/calendar/render');
    expect(confirmed.html).toContain('https://www.alorastudios.co.za/profile');
    expect(confirmed.html).toContain('/email/services/nails-gelx-short.jpg');
    expect(confirmed.attachments?.[0].contentType).toContain('text/calendar');
  });

  it('asks unpaid pay now customers to complete payment', () => {
    const email = bookingReceivedCustomerEmail({ ...context, paymentMethod: 'PAY_NOW' });
    expect(email.html).toContain('Complete your payment to lock it in');
  });

  it('explains the refund on a cancellation', () => {
    const email = bookingCancelledCustomerEmail(context, { cancelledBy: 'salon', refund: 'R250' });
    expect(email.html).toContain('A refund of R250');
    expect(email.subject.startsWith('Cancelled:')).toBe(true);
  });

  it('never contains an em dash', () => {
    const all = [
      bookingReceivedCustomerEmail(context),
      bookingConfirmedCustomerEmail(context),
      bookingCancelledCustomerEmail(context, { cancelledBy: 'customer', refund: null }),
      newBookingOwnerEmail(context),
    ];
    for (const email of all) {
      expect(email.html + email.text + email.subject).not.toContain(String.fromCharCode(0x2014));
    }
  });
});
