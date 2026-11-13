export const RETENTION_POLICY = {
  securityLogMonths: 12,
  financialRecordMonths: 60,
  rateLimitStaleHours: 24,
  alertWindowHours: 24,
} as const;

const HOUR_MS = 60 * 60 * 1_000;

export interface RetentionCutoffs {
  securityLogsBefore: Date;
  financialRecordsBefore: Date;
  rateLimitBefore: bigint;
  expiredBefore: Date;
  alertWindowStart: Date;
}

function daysInUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function subtractUtcMonths(date: Date, months: number): Date {
  const totalMonths = date.getUTCFullYear() * 12 + date.getUTCMonth() - months;
  const year = Math.floor(totalMonths / 12);
  const monthIndex = totalMonths - year * 12;
  const day = Math.min(date.getUTCDate(), daysInUtcMonth(year, monthIndex));
  return new Date(
    Date.UTC(
      year,
      monthIndex,
      day,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

export function retentionCutoffs(now: Date): RetentionCutoffs {
  return {
    securityLogsBefore: subtractUtcMonths(now, RETENTION_POLICY.securityLogMonths),
    financialRecordsBefore: subtractUtcMonths(now, RETENTION_POLICY.financialRecordMonths),
    rateLimitBefore: BigInt(now.getTime() - RETENTION_POLICY.rateLimitStaleHours * HOUR_MS),
    expiredBefore: new Date(now.getTime()),
    alertWindowStart: new Date(now.getTime() - RETENTION_POLICY.alertWindowHours * HOUR_MS),
  };
}
