import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

/**
 * Seed the service catalog. Idempotent (upsert by slug) so it's safe to re-run.
 * Prices are integer cents (ZAR); points mirror the pricing tiers.
 *   Run: npm run db:seed
 */
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const services = [
  {
    slug: 'wig-wash-style',
    name: 'Wig Wash & Style',
    description: 'Deep cleanse, condition and restyle for your wig.',
    priceCents: 35000,
    durationMinutes: 60,
    pointsAwarded: 35,
  },
  {
    slug: 'silk-press',
    name: 'Silk Press',
    description: 'Smooth, sleek press with a lightweight finish.',
    priceCents: 45000,
    durationMinutes: 90,
    pointsAwarded: 45,
  },
  {
    slug: 'protective-braids',
    name: 'Protective Braids',
    description: 'Long-lasting braided style that protects your natural hair.',
    priceCents: 60000,
    durationMinutes: 180,
    pointsAwarded: 60,
  },
  {
    slug: 'cut-and-shape',
    name: 'Cut & Shape',
    description: 'Precision cut tailored to your face and texture.',
    priceCents: 28000,
    durationMinutes: 45,
    pointsAwarded: 28,
  },
];

async function main() {
  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
  }
  console.log(`Seeded ${services.length} services.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
