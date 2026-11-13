import 'server-only';
import { prisma } from '@/lib/prisma';

export function listActiveServices() {
  return prisma.service.findMany({
    where: { active: true },
    orderBy: { priceCents: 'asc' },
  });
}

export function getServiceBySlug(slug: string) {
  return prisma.service.findFirst({ where: { slug, active: true } });
}
