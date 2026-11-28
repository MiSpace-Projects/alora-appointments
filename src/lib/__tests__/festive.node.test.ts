import { isFestiveSeason } from '@/lib/festive';

describe('isFestiveSeason', () => {
  it.each([
    ['2026-11-30T21:59:59.000Z', false],
    ['2026-11-30T22:00:00.000Z', true],
    ['2026-12-25T10:00:00.000Z', true],
    ['2027-01-06T21:59:59.000Z', true],
    ['2027-01-06T22:00:00.000Z', false],
    ['2027-07-15T10:00:00.000Z', false],
  ])('in South African time, %s is festive: %s', (iso, expected) => {
    expect(isFestiveSeason(new Date(iso))).toBe(expected);
  });

  it('can be forced on or off', () => {
    expect(isFestiveSeason(new Date('2027-07-15T10:00:00.000Z'), 'on')).toBe(true);
    expect(isFestiveSeason(new Date('2026-12-25T10:00:00.000Z'), 'off')).toBe(false);
    expect(isFestiveSeason(new Date('2026-12-25T10:00:00.000Z'), 'maybe')).toBe(true);
  });
});
