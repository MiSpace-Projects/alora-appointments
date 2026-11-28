const SAST_PARTS = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  month: 'numeric',
  day: 'numeric',
});

export type FestiveOverride = 'on' | 'off' | undefined;

export function isFestiveSeason(now: Date, override?: string): boolean {
  if (override === 'on') return true;
  if (override === 'off') return false;
  const parts = SAST_PARTS.formatToParts(now);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  return month === 12 || (month === 1 && day <= 6);
}

export function festiveSeasonNow(): boolean {
  return isFestiveSeason(new Date(), process.env.FESTIVE_SEASON);
}
