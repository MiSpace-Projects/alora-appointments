import { listActiveServices } from '@/lib/data/services';
import { isOnlinePaymentAvailable } from '@/lib/payments/provider';
import { BookingForm, type ServiceOption } from './BookingForm';

// Auth-gated and reads the live catalog from the DB per request — never
// prerendered at build time.
export const dynamic = 'force-dynamic';

/**
 * Server component: loads the live service catalog and renders the booking form.
 * Auth is enforced by the (protected) layout. Only the fields the form needs are
 * passed to the client, keeping the payload lean.
 */
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string | string[] }>;
}) {
  const [services, params] = await Promise.all([listActiveServices(), searchParams]);
  // Footer / marketing links deep-link a service by slug; unknown slugs simply
  // leave the select unset rather than erroring.
  const requestedSlug = Array.isArray(params.service) ? params.service[0] : params.service;
  const preselectedId = services.find((s) => s.slug === requestedSlug)?.id;

  const options: ServiceOption[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    priceCents: s.priceCents,
    durationMinutes: s.durationMinutes,
    pointsAwarded: s.pointsAwarded,
  }));

  return (
    <BookingForm
      services={options}
      preselectedServiceId={preselectedId}
      onlinePaymentAvailable={isOnlinePaymentAvailable()}
    />
  );
}
