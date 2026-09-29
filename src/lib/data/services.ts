import 'server-only';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const SERVICES_CACHE_TAG = 'services';

export const listActiveServices = unstable_cache(
  () =>
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { priceCents: 'asc' }],
    }),
  ['active-services', 'v4'],
  { revalidate: 3600, tags: [SERVICES_CACHE_TAG] },
);

export function getServiceBySlug(slug: string) {
  return prisma.service.findFirst({ where: { slug, active: true } });
}
