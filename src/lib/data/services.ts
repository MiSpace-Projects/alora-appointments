import 'server-only';
import { prisma } from '@/lib/prisma';

/**
 * Service catalog reads. Server-only: the DAL is the single place the database
 * is touched, so authorization and shaping live here rather than in components.
 */

export function listActiveServices() {
  return prisma.service.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { priceCents: 'asc' }],
  });
}

export function getServiceBySlug(slug: string) {
  return prisma.service.findFirst({ where: { slug, active: true } });
}
