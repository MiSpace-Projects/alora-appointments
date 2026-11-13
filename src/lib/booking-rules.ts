export const SAST_OFFSET_MINUTES = 120;
export const SAST_TIME_ZONE = 'Africa/Johannesburg';

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

export function parseSastLocalDateTime(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const match = LOCAL_DATE_TIME.exec(value.trim());
  if (!match) return value;
  const [, year, month, day, hour, minute, second = '00'] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+02:00`);
}

export interface SastClock {
  weekday: number;
  minutes: number;
}

export function sastClock(date: Date): SastClock {
  const shifted = new Date(date.getTime() + SAST_OFFSET_MINUTES * 60_000);
  return {
    weekday: shifted.getUTCDay(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

export interface DayHours {
  open: string;
  close: string;
}

export type OpeningHours = Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, DayHours | null>>;

function toMinutes(clock: string): number {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isWithinOpeningHours(
  startsAt: Date,
  durationMinutes: number,
  hours: OpeningHours | null,
): boolean {
  if (!hours) return true;
  const { weekday, minutes } = sastClock(startsAt);
  const day = hours[weekday as keyof OpeningHours];
  if (!day) return false;
  return minutes >= toMinutes(day.open) && minutes + durationMinutes <= toMinutes(day.close);
}

export interface TimedBooking {
  startsAt: Date;
  durationMinutes: number;
}

export function overlaps(a: TimedBooking, b: TimedBooking): boolean {
  const aStart = a.startsAt.getTime();
  const bStart = b.startsAt.getTime();
  return (
    aStart < bStart + b.durationMinutes * 60_000 && bStart < aStart + a.durationMinutes * 60_000
  );
}

export function countOverlapping(candidate: TimedBooking, existing: TimedBooking[]): number {
  return existing.filter((booking) => overlaps(candidate, booking)).length;
}
