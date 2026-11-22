import 'server-only';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const TESTIMONIALS_CACHE_TAG = 'testimonials';
export const PUBLISHED_TESTIMONIAL_LIMIT = 6;

export interface PublishedTestimonial {
  id: string;
  rating: number;
  body: string;
  displayName: string;
  serviceName: string;
  photos: { url: string; width: number; height: number }[];
}

export const listPublishedTestimonials = unstable_cache(
  async (): Promise<PublishedTestimonial[]> => {
    const rows = await prisma.testimonial.findMany({
      where: { status: 'PUBLISHED', consentAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      take: PUBLISHED_TESTIMONIAL_LIMIT,
      select: {
        id: true,
        rating: true,
        body: true,
        displayName: true,
        booking: { select: { service: { select: { name: true } } } },
        photos: { orderBy: { position: 'asc' }, select: { url: true, width: true, height: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      rating: row.rating ?? 5,
      body: row.body ?? '',
      displayName: row.displayName ?? 'Alora client',
      serviceName: row.booking.service.name,
      photos: row.photos,
    }));
  },
  ['published-testimonials', 'v1'],
  { revalidate: 3600, tags: [TESTIMONIALS_CACHE_TAG] },
);
