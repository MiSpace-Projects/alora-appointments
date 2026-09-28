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

export function formatDateTime(date: Date | string): string {
  return `${formatBookingDate(date)}, ${formatBookingTime(date)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr${hours > 1 ? 's' : ''}` : `${hours} hr ${rest} min`;
}

export function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function getFirstName(name?: string | null): string {
  if (!name) return 'there';
  return name.split(' ')[0];
}
