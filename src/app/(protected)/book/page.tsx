import type { Metadata } from 'next';
import { listActiveServices } from '@/lib/data/services';
import { isOnlinePaymentAvailable } from '@/lib/payments/provider';
import { groupByFamily } from '@/app/features/servicesSection/servicesData';
import { BookingForm, type FamilyOption, type ServiceOption } from './BookingForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Book an appointment', robots: { index: false } };

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string | string[] }>;
}) {
  const [services, params] = await Promise.all([listActiveServices(), searchParams]);
  const requestedSlug = Array.isArray(params.service) ? params.service[0] : params.service;

  const groups = groupByFamily(services);
  const families: FamilyOption[] = groups.map(({ family }) => ({
    slug: family.slug,
    title: family.title,
  }));
  const options: ServiceOption[] = groups.flatMap(({ family, items }) =>
    items.map((s) => ({
      id: s.id,
      familySlug: family.slug,
      name: s.name,
      priceCents: s.priceCents,
      priceType: s.priceType,
      priceMaxCents: s.priceMaxCents,
      durationMinutes: s.durationMinutes,
      pointsAwarded: s.pointsAwarded,
    })),
  );
  const preselected = options.find(
    (option) => services.find((s) => s.id === option.id)?.slug === requestedSlug,
  );

  return (
    <BookingForm
      families={families}
      services={options}
      preselectedServiceId={preselected?.id}
      onlinePaymentAvailable={isOnlinePaymentAvailable()}
    />
  );
}
