import 'server-only';
import type { TestimonialStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TESTIMONIAL_MAX_PHOTOS } from '@/lib/testimonial-core';

const REVIEWABLE: TestimonialStatus[] = ['SUBMITTED', 'PUBLISHED', 'HIDDEN'];

export class TestimonialActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TestimonialActionError';
  }
}

export async function listOwnerTestimonials() {
  return prisma.testimonial.findMany({
    where: { status: { in: REVIEWABLE } },
    orderBy: [{ submittedAt: 'desc' }],
    select: {
      id: true,
      status: true,
      rating: true,
      body: true,
      displayName: true,
      submittedAt: true,
      publishedAt: true,
      user: { select: { name: true, email: true } },
      booking: { select: { startsAt: true, service: { select: { name: true } } } },
      photos: {
        orderBy: { position: 'asc' },
        select: { id: true, url: true, width: true, height: true },
      },
    },
  });
}

export type OwnerTestimonial = Awaited<ReturnType<typeof listOwnerTestimonials>>[number];

export async function assertPhotoSlot(testimonialId: string): Promise<void> {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id: testimonialId },
    select: { status: true, _count: { select: { photos: true } } },
  });
  if (!testimonial || !REVIEWABLE.includes(testimonial.status)) {
    throw new TestimonialActionError('Photos can only be added once the customer has submitted.');
  }
  if (testimonial._count.photos >= TESTIMONIAL_MAX_PHOTOS) {
    throw new TestimonialActionError(
      `A testimonial can have up to ${TESTIMONIAL_MAX_PHOTOS} photos.`,
    );
  }
}

export async function addTestimonialPhoto(
  testimonialId: string,
  photo: { url: string; pathname: string; width: number; height: number },
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`testimonial:${testimonialId}`}))`;
    const count = await tx.testimonialPhoto.count({ where: { testimonialId } });
    if (count >= TESTIMONIAL_MAX_PHOTOS) {
      throw new TestimonialActionError(
        `A testimonial can have up to ${TESTIMONIAL_MAX_PHOTOS} photos.`,
      );
    }
    await tx.testimonialPhoto.create({ data: { testimonialId, position: count, ...photo } });
  });
}

export async function removeTestimonialPhoto(photoId: string): Promise<string | null> {
  const photo = await prisma.testimonialPhoto.findUnique({
    where: { id: photoId },
    select: { url: true },
  });
  if (!photo) return null;
  await prisma.testimonialPhoto.deleteMany({ where: { id: photoId } });
  return photo.url;
}

export async function setTestimonialVisibility(
  testimonialId: string,
  visibility: 'PUBLISHED' | 'HIDDEN',
  now: Date = new Date(),
): Promise<void> {
  const from: TestimonialStatus[] =
    visibility === 'PUBLISHED' ? ['SUBMITTED', 'HIDDEN'] : ['SUBMITTED', 'PUBLISHED'];
  const result = await prisma.testimonial.updateMany({
    where: { id: testimonialId, status: { in: from }, consentAt: { not: null } },
    data:
      visibility === 'PUBLISHED'
        ? { status: 'PUBLISHED', publishedAt: now }
        : { status: 'HIDDEN', publishedAt: null },
  });
  if (result.count === 0)
    throw new TestimonialActionError('That testimonial has changed. Refresh.');
}

export async function deleteTestimonial(testimonialId: string): Promise<string[]> {
  const photos = await prisma.testimonialPhoto.findMany({
    where: { testimonialId },
    select: { url: true },
  });
  await prisma.testimonial.deleteMany({ where: { id: testimonialId } });
  return photos.map((photo) => photo.url);
}

export async function testimonialPhotoUrlsForUser(userId: string): Promise<string[]> {
  const photos = await prisma.testimonialPhoto.findMany({
    where: { testimonial: { userId } },
    select: { url: true },
  });
  return photos.map((photo) => photo.url);
}
