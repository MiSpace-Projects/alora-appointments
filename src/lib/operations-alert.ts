import 'server-only';
import { operationsAlertEmail, sendAuthEmail, type OperationsAlertLine } from './email';
import type { FailureCounts } from './data/retention';

export type AlertStatus = 'NOTHING_TO_REPORT' | 'NO_RECIPIENT' | 'SENT' | 'SEND_FAILED';

export function failureAlertLines(counts: FailureCounts): OperationsAlertLine[] {
  return [
    { label: 'Emails that failed to send', count: counts.emailFailures },
    { label: 'Refunds that failed', count: counts.refundFailures },
    { label: 'Online payments that failed', count: counts.paymentFailures },
  ];
}

export async function sendFailureAlert(
  counts: FailureCounts,
  window: { start: Date; end: Date },
): Promise<AlertStatus> {
  const lines = failureAlertLines(counts);
  if (lines.every((line) => line.count === 0)) return 'NOTHING_TO_REPORT';
  const recipient = process.env.ALERT_EMAIL?.trim();
  if (!recipient) return 'NO_RECIPIENT';
  const content = operationsAlertEmail({
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    lines,
  });
  const sent = await sendAuthEmail({
    kind: 'OPERATIONS_ALERT',
    to: recipient,
    subject: 'Alora daily alert: failures in the last 24 hours',
    ...content,
    tags: ['operations', 'alert'],
  });
  return sent ? 'SENT' : 'SEND_FAILED';
}
