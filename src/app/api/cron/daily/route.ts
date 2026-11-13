import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { countRecentFailures, purgeExpiredData } from '@/lib/data/retention';
import { sendFailureAlert } from '@/lib/operations-alert';
import { retentionCutoffs } from '@/lib/retention-core';

export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return Response.json({ code: 'UNAUTHORIZED' }, { status: 401, headers: NO_STORE });
  }

  const now = new Date();
  const { alertWindowStart } = retentionCutoffs(now);

  try {
    const failures = await countRecentFailures(alertWindowStart);
    const alert = await sendFailureAlert(failures, { start: alertWindowStart, end: now });
    const retention = await purgeExpiredData(now);

    console.info(
      JSON.stringify({
        level: 'info',
        service: 'cron',
        event: 'DAILY_JOB_COMPLETED',
        failures,
        alert,
        retention,
      }),
    );

    return Response.json(
      {
        ok: true,
        ranAt: now.toISOString(),
        alertWindow: { start: alertWindowStart.toISOString(), end: now.toISOString() },
        failures,
        alert,
        retention,
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'cron',
        event: 'DAILY_JOB_FAILED',
        errorName: error instanceof Error ? error.name : 'UnknownError',
      }),
    );
    return Response.json(
      { ok: false, code: 'DAILY_JOB_FAILED' },
      { status: 500, headers: NO_STORE },
    );
  }
}
