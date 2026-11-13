import {
  countOverlapping,
  describeOpeningHours,
  isWithinOpeningHours,
  parseSastLocalDateTime,
  sastClock,
  type OpeningHours,
} from '@/lib/booking-rules';

describe('parseSastLocalDateTime', () => {
  it('reads a datetime-local value as South African time, whatever the device zone', () => {
    const parsed = parseSastLocalDateTime('2026-12-05T10:00') as Date;
    expect(parsed.toISOString()).toBe('2026-12-05T08:00:00.000Z');
  });

  it('leaves dates and other values untouched', () => {
    const date = new Date('2026-12-05T08:00:00.000Z');
    expect(parseSastLocalDateTime(date)).toBe(date);
    expect(parseSastLocalDateTime('2026-12-05T08:00:00.000Z')).toBe('2026-12-05T08:00:00.000Z');
    expect(parseSastLocalDateTime(undefined)).toBeUndefined();
  });
});

describe('sastClock', () => {
  it('converts an instant to the SAST weekday and minute of day', () => {
    expect(sastClock(new Date('2026-12-05T22:30:00.000Z'))).toEqual({ weekday: 0, minutes: 30 });
  });
});

describe('isWithinOpeningHours', () => {
  const hours: OpeningHours = {
    1: { open: '09:00', close: '17:00' },
    6: { open: '08:00', close: '13:00' },
    0: null,
  };

  it('allows any time when no hours are configured', () => {
    expect(isWithinOpeningHours(new Date('2026-12-06T01:00:00.000Z'), 60, null)).toBe(true);
  });

  it('accepts a booking that starts and ends inside the day', () => {
    expect(isWithinOpeningHours(new Date('2026-12-07T07:00:00.000Z'), 120, hours)).toBe(true);
  });

  it('rejects a booking that runs past closing', () => {
    expect(isWithinOpeningHours(new Date('2026-12-07T14:30:00.000Z'), 60, hours)).toBe(false);
  });

  it('rejects closed days and days without hours', () => {
    expect(isWithinOpeningHours(new Date('2026-12-06T08:00:00.000Z'), 30, hours)).toBe(false);
    expect(isWithinOpeningHours(new Date('2026-12-08T08:00:00.000Z'), 30, hours)).toBe(false);
  });

  it('rejects a 03:00 booking', () => {
    expect(isWithinOpeningHours(new Date('2026-12-07T01:00:00.000Z'), 30, hours)).toBe(false);
  });
});

describe('countOverlapping', () => {
  const at = (iso: string, durationMinutes: number) => ({
    startsAt: new Date(iso),
    durationMinutes,
  });

  it('counts bookings whose time ranges intersect', () => {
    const existing = [at('2026-12-07T08:00:00.000Z', 120), at('2026-12-07T11:00:00.000Z', 60)];
    expect(countOverlapping(at('2026-12-07T09:30:00.000Z', 60), existing)).toBe(1);
    expect(countOverlapping(at('2026-12-07T09:30:00.000Z', 120), existing)).toBe(2);
  });

  it('treats back to back bookings as not overlapping', () => {
    const existing = [at('2026-12-07T08:00:00.000Z', 60)];
    expect(countOverlapping(at('2026-12-07T09:00:00.000Z', 60), existing)).toBe(0);
  });
});

describe('describeOpeningHours', () => {
  it('groups consecutive days with the same hours', () => {
    const day = { open: '09:00', close: '19:00' };
    expect(describeOpeningHours({ 0: null, 1: day, 2: day, 3: day, 4: day, 5: day, 6: day })).toBe(
      'Monday to Saturday, 09:00 to 19:00',
    );
  });

  it('lists days with different hours separately', () => {
    expect(
      describeOpeningHours({
        1: { open: '09:00', close: '17:00' },
        6: { open: '08:00', close: '13:00' },
      }),
    ).toBe('Monday, 09:00 to 17:00; Saturday, 08:00 to 13:00');
  });

  it('returns null when no hours are configured', () => {
    expect(describeOpeningHours(null)).toBeNull();
  });
});
