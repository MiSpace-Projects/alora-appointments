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

/**
 * Curated style menu for Black South African clients. PRICES, DURATIONS AND
 * POINTS ARE PLACEHOLDERS until the salon supplies its real list; the owner
 * edits them in the database and the site reflects it without a deploy.
 * `imageUrl` is the transparent cutout shown in the style showcase; styles
 * without artwork yet render without an image until it is supplied.
 */
const services = [
  // ── Braids ──
  {
    slug: 'knotless-braids',
    category: 'Braids',
    sortOrder: 1,
    name: 'Knotless Braids',
    description: 'Feather-light, tension-free braids that lie flat from the root.',
    priceCents: 95000,
    durationMinutes: 300,
    pointsAwarded: 95,
    imageUrl: '/styles/knotless-braids-cutout.png',
  },
  {
    slug: 'box-braids',
    category: 'Braids',
    sortOrder: 2,
    name: 'Box Braids',
    description: 'Classic sectioned braids in your choice of length and thickness.',
    priceCents: 85000,
    durationMinutes: 300,
    pointsAwarded: 85,
    imageUrl: null,
  },
  {
    slug: 'cornrows',
    category: 'Braids',
    sortOrder: 3,
    name: 'Cornrows',
    description: 'Clean, sculpted lines, from straight-backs to feed-in designs.',
    priceCents: 35000,
    durationMinutes: 120,
    pointsAwarded: 35,
    imageUrl: null,
  },
  {
    slug: 'fulani-braids',
    category: 'Braids',
    sortOrder: 4,
    name: 'Fulani Braids',
    description: 'Centre-part cornrows with braids down and beaded accents.',
    priceCents: 75000,
    durationMinutes: 240,
    pointsAwarded: 75,
    imageUrl: null,
  },
  // ── Locs & twists ──
  {
    slug: 'faux-locs',
    category: 'Locs & Twists',
    sortOrder: 1,
    name: 'Faux Locs',
    description: 'Soft, boho or goddess locs installed over your natural hair.',
    priceCents: 110000,
    durationMinutes: 360,
    pointsAwarded: 110,
    imageUrl: null,
  },
  {
    slug: 'passion-twists',
    category: 'Locs & Twists',
    sortOrder: 2,
    name: 'Passion Twists',
    description: 'Springy, textured twists with a lived-in curl.',
    priceCents: 80000,
    durationMinutes: 240,
    pointsAwarded: 80,
    imageUrl: null,
  },
  {
    slug: 'loc-retwist',
    category: 'Locs & Twists',
    sortOrder: 3,
    name: 'Loc Retwist',
    description: 'Root retwist, cleanse and style for established locs.',
    priceCents: 45000,
    durationMinutes: 120,
    pointsAwarded: 45,
    imageUrl: null,
  },
  // ── Natural ──
  {
    slug: 'twist-out',
    category: 'Natural',
    sortOrder: 1,
    name: 'Twist-Out',
    description: 'Defined, bouncy curls set with a two-strand twist.',
    priceCents: 40000,
    durationMinutes: 120,
    pointsAwarded: 40,
    imageUrl: '/styles/twist-out-cutout.png',
  },
  {
    slug: 'wash-and-go',
    category: 'Natural',
    sortOrder: 2,
    name: 'Wash & Go',
    description: 'Cleanse, deep condition and a defined natural finish.',
    priceCents: 30000,
    durationMinutes: 75,
    pointsAwarded: 30,
    imageUrl: '/styles/wash-and-go-cutout.png',
  },
  {
    slug: 'cut-and-shape',
    category: 'Natural',
    sortOrder: 3,
    name: 'Afro Shaping',
    description: 'Precision shaping and trim that respects your texture.',
    priceCents: 28000,
    durationMinutes: 45,
    pointsAwarded: 28,
    imageUrl: '/styles/afro-shaping-cutout.png',
  },
  {
    slug: 'bantu-knots',
    category: 'Natural',
    sortOrder: 4,
    name: 'Bantu Knots',
    description: 'Sculpted knots as a style, or as a heatless curl set.',
    priceCents: 35000,
    durationMinutes: 90,
    pointsAwarded: 35,
    imageUrl: null,
  },
  // ── Press & wigs ──
  {
    slug: 'silk-press',
    category: 'Press & Wigs',
    sortOrder: 1,
    name: 'Silk Press',
    description: 'Smooth, sleek press with a lightweight finish.',
    priceCents: 45000,
    durationMinutes: 90,
    pointsAwarded: 45,
    imageUrl: null,
  },
  {
    slug: 'wig-wash-style',
    category: 'Press & Wigs',
    sortOrder: 2,
    name: 'Wig Install & Style',
    description: 'Frontal or closure install, laid, styled and set.',
    priceCents: 35000,
    durationMinutes: 60,
    pointsAwarded: 35,
    imageUrl: null,
  },
];

/** Slugs from earlier seeds that the curated menu supersedes; kept for booking history, hidden from the site. */
const retiredSlugs = ['protective-braids'];

async function main() {
  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
  }
  await prisma.service.updateMany({
    where: { slug: { in: retiredSlugs } },
    data: { active: false },
  });
  console.log(`Seeded ${services.length} services; retired ${retiredSlugs.length}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
