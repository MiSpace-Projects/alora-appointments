import 'server-only';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * Service catalog reads. Server-only: the DAL is the single place the database
 * is touched, so authorization and shaping live here rather than in components.
 */

/** Cache tag for the catalog; revalidate this after an admin edit/seed. */
export const SERVICES_CACHE_TAG = 'services';

/**
 * Active catalog, ordered for display. Cached across requests (the catalog is
 * slow-changing and shown on the home, book and every service page) with a
 * 1-hour revalidate + tag. This is display only — createBooking re-reads the
 * service directly, so the price a customer is charged is never the cached one.
 */
export const listActiveServices = unstable_cache(
  () =>
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { priceCents: 'asc' }],
    }),
  ['active-services'],
  { revalidate: 3600, tags: [SERVICES_CACHE_TAG] },
);

export function getServiceBySlug(slug: string) {
  return prisma.service.findFirst({ where: { slug, active: true } });
}
