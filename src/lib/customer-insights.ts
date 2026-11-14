export const LAPSED_AFTER_DAYS = 90;
const DAY_MS = 24 * 60 * 60_000;

export type CustomerBookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface CustomerBookingInput {
  id: string;
  startsAt: Date;
  status: CustomerBookingStatus;
  priceCents: number;
  serviceName: string;
  category: string | null;
}

export interface CustomerInput {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  marketingOptIn: boolean;
  createdAt: Date;
  points: number;
  isOwner: boolean;
  bookings: CustomerBookingInput[];
}

export type CustomerSegment =
  | 'upcoming'
  | 'returning'
  | 'lapsed'
  | 'never-booked'
  | 'marketing'
  | 'unverified';

export interface CustomerHistoryEntry {
  id: string;
  startsAt: string;
  status: CustomerBookingStatus;
  serviceName: string;
  priceCents: number;
}

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  marketingOptIn: boolean;
  isOwner: boolean;
  joinedAt: string;
  points: number;
  totalBookings: number;
  completedVisits: number;
  cancelled: number;
  upcoming: number;
  spendCents: number;
  nextVisit: string | null;
  lastVisit: string | null;
  favouriteFamily: string | null;
  cancellationRate: number;
  segments: CustomerSegment[];
  history: CustomerHistoryEntry[];
}

const isActive = (status: CustomerBookingStatus) => status === 'PENDING' || status === 'CONFIRMED';

export function summarizeCustomer(
  customer: CustomerInput,
  now: Date,
  familyTitle: (category: string | null) => string | null,
): CustomerSummary {
  const time = now.getTime();
  const bookings = [...customer.bookings].sort(
    (a, b) => b.startsAt.getTime() - a.startsAt.getTime(),
  );
  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length;
  const upcoming = bookings
    .filter((b) => isActive(b.status) && b.startsAt.getTime() > time)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const lastVisit = completed.find((b) => b.startsAt.getTime() <= time) ?? null;

  const familyCounts = new Map<string, number>();
  for (const booking of bookings) {
    if (booking.status === 'CANCELLED') continue;
    const family = familyTitle(booking.category);
    if (family) familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
  }
  const favouriteFamily =
    [...familyCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
    null;

  const segments: CustomerSegment[] = [];
  if (upcoming.length > 0) segments.push('upcoming');
  if (completed.length >= 2) segments.push('returning');
  if (
    lastVisit &&
    upcoming.length === 0 &&
    time - lastVisit.startsAt.getTime() > LAPSED_AFTER_DAYS * DAY_MS
  ) {
    segments.push('lapsed');
  }
  if (bookings.length === 0) segments.push('never-booked');
  if (customer.marketingOptIn) segments.push('marketing');
  if (!customer.emailVerified) segments.push('unverified');

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    emailVerified: customer.emailVerified,
    marketingOptIn: customer.marketingOptIn,
    isOwner: customer.isOwner,
    joinedAt: customer.createdAt.toISOString(),
    points: customer.points,
    totalBookings: bookings.length,
    completedVisits: completed.length,
    cancelled,
    upcoming: upcoming.length,
    spendCents: completed.reduce((sum, b) => sum + b.priceCents, 0),
    nextVisit: upcoming[0]?.startsAt.toISOString() ?? null,
    lastVisit: lastVisit?.startsAt.toISOString() ?? null,
    favouriteFamily,
    cancellationRate: bookings.length === 0 ? 0 : cancelled / bookings.length,
    segments,
    history: bookings.map((b) => ({
      id: b.id,
      startsAt: b.startsAt.toISOString(),
      status: b.status,
      serviceName: b.serviceName,
      priceCents: b.priceCents,
    })),
  };
}

export interface DirectoryOverview {
  customers: number;
  newLast30Days: number;
  returning: number;
  returningShare: number;
  spendCents: number;
  visitsNext7Days: number;
  marketable: number;
}

export function directoryOverview(summaries: CustomerSummary[], now: Date): DirectoryOverview {
  const time = now.getTime();
  const visited = summaries.filter((s) => s.completedVisits > 0).length;
  const returning = summaries.filter((s) => s.segments.includes('returning')).length;
  return {
    customers: summaries.length,
    newLast30Days: summaries.filter((s) => time - Date.parse(s.joinedAt) <= 30 * DAY_MS).length,
    returning,
    returningShare: visited === 0 ? 0 : returning / visited,
    spendCents: summaries.reduce((sum, s) => sum + s.spendCents, 0),
    visitsNext7Days: summaries.reduce(
      (count, s) =>
        count +
        s.history.filter((h) => {
          const at = Date.parse(h.startsAt);
          return isActive(h.status) && at > time && at - time <= 7 * DAY_MS;
        }).length,
      0,
    ),
    marketable: summaries.filter((s) => s.marketingOptIn).length,
  };
}

const CSV_FORMULA = /^[=+\-@\t\r]/;

function csvCell(value: string): string {
  const safe = CSV_FORMULA.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function marketingCsv(summaries: CustomerSummary[]): string {
  const rows = summaries
    .filter((s) => s.marketingOptIn)
    .map((s) => [s.name, s.email, s.joinedAt.slice(0, 10)].map(csvCell).join(','));
  return ['"Name","Email","Joined"', ...rows].join('\r\n');
}
