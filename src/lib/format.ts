/**
 * format.ts — shared display formatting.
 *
 * Fixed locale + options so the same string renders on the server and the
 * client (no hydration mismatch). Money is stored as integer cents (ZAR); these
 * helpers are the one place we turn that into human text.
 */

const zarDate = new Intl.DateTimeFormat('en-ZA', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const zarTime = new Intl.DateTimeFormat('en-ZA', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatZar(cents: number): string {
  return `R${Math.round(cents / 100).toLocaleString('en-ZA')}`;
}

export function formatBookingDate(date: Date | string): string {
  return zarDate.format(new Date(date));
}

export function formatBookingTime(date: Date | string): string {
  return zarTime.format(new Date(date));
}

/** "Mon DD, YYYY, HH:MM" — one line, used on receipts and security rows. */
export function formatDateTime(date: Date | string): string {
  return `${formatBookingDate(date)}, ${formatBookingTime(date)}`;
}

/** Human duration from minutes: "45 min", "1 hr", "1 hr 30 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr${hours > 1 ? 's' : ''}` : `${hours} hr ${rest} min`;
}

/** Up-to-two-letter initials for an avatar; "U" when no name. */
export function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** First name for a greeting; "there" when no name. */
export function getFirstName(name?: string | null): string {
  if (!name) return 'there';
  return name.split(' ')[0];
}
