import { RETENTION_POLICY, retentionCutoffs, subtractUtcMonths } from '@/lib/retention-core';

describe('subtractUtcMonths', () => {
  it('keeps the day and time when the target month has that day', () => {
    expect(subtractUtcMonths(new Date('2026-11-13T01:02:03.004Z'), 12).toISOString()).toBe(
      '2025-11-13T01:02:03.004Z',
    );
  });

  it('clamps to the last day of a shorter month', () => {
    expect(subtractUtcMonths(new Date('2026-03-31T00:00:00.000Z'), 1).toISOString()).toBe(
      '2026-02-28T00:00:00.000Z',
    );
  });

  it('clamps a leap day to 28 February in a common year', () => {
    expect(subtractUtcMonths(new Date('2028-02-29T12:00:00.000Z'), 12).toISOString()).toBe(
      '2027-02-28T12:00:00.000Z',
    );
  });

  it('crosses year boundaries', () => {
    expect(subtractUtcMonths(new Date('2026-01-15T00:00:00.000Z'), 2).toISOString()).toBe(
      '2025-11-15T00:00:00.000Z',
    );
  });
});

describe('retentionCutoffs', () => {
  const now = new Date('2026-11-13T02:00:00.000Z');
  const cutoffs = retentionCutoffs(now);

  it('matches the periods stated in the privacy policy', () => {
    expect(RETENTION_POLICY.securityLogMonths).toBe(12);
    expect(RETENTION_POLICY.financialRecordMonths).toBe(60);
  });

  it('keeps security logs for twelve months', () => {
    expect(cutoffs.securityLogsBefore.toISOString()).toBe('2025-11-13T02:00:00.000Z');
  });

  it('keeps bookings and payments for five years', () => {
    expect(cutoffs.financialRecordsBefore.toISOString()).toBe('2021-11-13T02:00:00.000Z');
  });

  it('treats rate limit rows idle for a day as stale', () => {
    expect(cutoffs.rateLimitBefore).toBe(BigInt(now.getTime() - 24 * 60 * 60 * 1_000));
  });

  it('expires sessions and verifications at the current time', () => {
    expect(cutoffs.expiredBefore.getTime()).toBe(now.getTime());
  });

  it('alerts on the last 24 hours', () => {
    expect(cutoffs.alertWindowStart.toISOString()).toBe('2026-11-12T02:00:00.000Z');
  });
});
