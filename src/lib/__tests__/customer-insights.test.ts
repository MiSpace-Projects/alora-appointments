import {
  directoryOverview,
  marketingCsv,
  summarizeCustomer,
  type CustomerBookingInput,
  type CustomerInput,
} from '@/lib/customer-insights';

const now = new Date('2026-11-14T10:00:00.000Z');
const day = 24 * 60 * 60_000;
const at = (offsetDays: number) => new Date(now.getTime() + offsetDays * day);
const family = (category: string | null) =>
  category === 'Nails' ? 'Nail Art' : category === 'Wig Care' ? 'Wig Care' : null;

let counter = 0;
const booking = (
  offsetDays: number,
  status: CustomerBookingInput['status'],
  category = 'Nails',
  priceCents = 35_000,
): CustomerBookingInput => {
  counter += 1;
  return {
    id: `b${counter}`,
    startsAt: at(offsetDays),
    status,
    priceCents,
    serviceName: 'Service',
    category,
  };
};

const customer = (overrides: Partial<CustomerInput> = {}): CustomerInput => ({
  id: 'c1',
  name: 'Lerato',
  email: 'lerato@example.com',
  emailVerified: true,
  marketingOptIn: false,
  createdAt: at(-200),
  points: 0,
  isOwner: false,
  bookings: [],
  ...overrides,
});

describe('summarizeCustomer', () => {
  it('counts visits, spend only from completed visits, and the next and last visit', () => {
    const summary = summarizeCustomer(
      customer({
        bookings: [
          booking(-40, 'COMPLETED', 'Nails', 35_000),
          booking(-10, 'COMPLETED', 'Wig Care', 25_000),
          booking(5, 'CONFIRMED', 'Nails', 40_000),
          booking(-3, 'CANCELLED'),
        ],
      }),
      now,
      family,
    );
    expect(summary.completedVisits).toBe(2);
    expect(summary.spendCents).toBe(60_000);
    expect(summary.upcoming).toBe(1);
    expect(summary.nextVisit).toBe(at(5).toISOString());
    expect(summary.lastVisit).toBe(at(-10).toISOString());
    expect(summary.cancellationRate).toBe(0.25);
    expect(summary.favouriteFamily).toBe('Nail Art');
    expect(summary.segments).toEqual(expect.arrayContaining(['upcoming', 'returning']));
    expect(summary.segments).not.toContain('lapsed');
  });

  it('marks a customer lapsed after 90 days with nothing booked', () => {
    const summary = summarizeCustomer(
      customer({ bookings: [booking(-120, 'COMPLETED')] }),
      now,
      family,
    );
    expect(summary.segments).toContain('lapsed');
  });

  it('does not mark a lapsed customer who has something booked', () => {
    const summary = summarizeCustomer(
      customer({ bookings: [booking(-120, 'COMPLETED'), booking(3, 'PENDING')] }),
      now,
      family,
    );
    expect(summary.segments).not.toContain('lapsed');
  });

  it('flags never booked, marketing and unverified accounts', () => {
    const summary = summarizeCustomer(
      customer({ marketingOptIn: true, emailVerified: false }),
      now,
      family,
    );
    expect(summary.segments).toEqual(['never-booked', 'marketing', 'unverified']);
    expect(summary.favouriteFamily).toBeNull();
    expect(summary.cancellationRate).toBe(0);
  });
});

describe('directoryOverview', () => {
  it('summarises the directory', () => {
    const summaries = [
      summarizeCustomer(
        customer({
          id: 'a',
          marketingOptIn: true,
          bookings: [booking(-30, 'COMPLETED'), booking(-5, 'COMPLETED'), booking(2, 'PENDING')],
        }),
        now,
        family,
      ),
      summarizeCustomer(
        customer({ id: 'b', createdAt: at(-3), bookings: [booking(-1, 'COMPLETED')] }),
        now,
        family,
      ),
      summarizeCustomer(customer({ id: 'c', bookings: [booking(20, 'CONFIRMED')] }), now, family),
    ];
    expect(directoryOverview(summaries, now)).toEqual({
      customers: 3,
      newLast30Days: 1,
      returning: 1,
      returningShare: 0.5,
      spendCents: 105_000,
      visitsNext7Days: 1,
      marketable: 1,
    });
  });
});

describe('marketingCsv', () => {
  it('exports only opted-in customers and neutralises spreadsheet formulas', () => {
    const csv = marketingCsv([
      summarizeCustomer(
        customer({ id: 'a', name: '=HYPERLINK("x")', marketingOptIn: true }),
        now,
        family,
      ),
      summarizeCustomer(customer({ id: 'b', email: 'no@example.com' }), now, family),
    ]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).not.toContain('no@example.com');
  });
});
