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
