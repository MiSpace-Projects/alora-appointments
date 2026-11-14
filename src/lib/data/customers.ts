import 'server-only';
import { prisma } from '@/lib/prisma';
import { parseOwnerAllowlist } from '@/lib/owner-core';
import type { CustomerInput } from '@/lib/customer-insights';

export async function listCustomerRecords(): Promise<CustomerInput[]> {
  const [users, balances] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        marketingOptIn: true,
        createdAt: true,
        bookings: {
          select: {
            id: true,
            startsAt: true,
            status: true,
            priceCents: true,
            service: { select: { name: true, category: true } },
          },
        },
      },
    }),
    prisma.pointsTransaction.groupBy({ by: ['userId'], _sum: { delta: true } }),
  ]);

  const owners = new Set(parseOwnerAllowlist(process.env.ALORA_OWNER_EMAILS));
  const points = new Map(balances.map((row) => [row.userId, row._sum.delta ?? 0]));

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    marketingOptIn: user.marketingOptIn,
    createdAt: user.createdAt,
    points: points.get(user.id) ?? 0,
    isOwner: owners.has(user.email.toLowerCase()),
    bookings: user.bookings.map((booking) => ({
      id: booking.id,
      startsAt: booking.startsAt,
      status: booking.status,
      priceCents: booking.priceCents,
      serviceName: booking.service.name,
      category: booking.service.category,
    })),
  }));
}
