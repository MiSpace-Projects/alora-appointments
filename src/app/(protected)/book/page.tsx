import type { Metadata } from 'next';
import { listActiveServices } from '@/lib/data/services';
import { isOnlinePaymentAvailable } from '@/lib/payments/provider';
import { BookingForm, type ServiceOption } from './BookingForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Book an appointment', robots: { index: false } };

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string | string[] }>;
}) {
  const [services, params] = await Promise.all([listActiveServices(), searchParams]);
  const requestedSlug = Array.isArray(params.service) ? params.service[0] : params.service;
  const preselectedId = services.find((s) => s.slug === requestedSlug)?.id;

  const options: ServiceOption[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    priceCents: s.priceCents,
    priceType: s.priceType,
    priceMaxCents: s.priceMaxCents,
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
