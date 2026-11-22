import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  createTestimonialToken,
  hashTestimonialToken,
  isWellFormedTestimonialToken,
  testimonialDisplayName,
  testimonialInviteExpiry,
  type TestimonialSubmission,
} from '@/lib/testimonial-core';

export type TestimonialInviteState = 'OPEN' | 'SUBMITTED' | 'EXPIRED' | 'NOT_FOUND';

export interface TestimonialInvite {
  state: TestimonialInviteState;
  customerFirstName: string;
  serviceName: string;
  visitedAt: Date;
}

export type SubmitTestimonialResult = 'SUBMITTED' | 'ALREADY_SUBMITTED' | 'EXPIRED' | 'NOT_FOUND';

export async function createTestimonialInvite(
  bookingId: string,
  now: Date = new Date(),
): Promise<string | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { status: true, userId: true },
  });
  if (!booking || booking.status !== 'COMPLETED' || !booking.userId) return null;

  const { token, tokenHash } = createTestimonialToken();
  try {
    await prisma.testimonial.create({
      data: {
        bookingId,
        userId: booking.userId,
        tokenHash,
        expiresAt: testimonialInviteExpiry(now),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      return null;
    throw error;
  }
  return token;
}

async function findByToken(token: string) {
  if (!isWellFormedTestimonialToken(token)) return null;
  return prisma.testimonial.findUnique({
    where: { tokenHash: hashTestimonialToken(token) },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      user: { select: { name: true } },
      booking: { select: { startsAt: true, service: { select: { name: true } } } },
    },
  });
}

export async function getTestimonialInvite(
  token: string,
  now: Date = new Date(),
): Promise<TestimonialInvite | null> {
  const row = await findByToken(token);
  if (!row?.user) return null;
  const state: TestimonialInviteState =
    row.status !== 'INVITED' ? 'SUBMITTED' : row.expiresAt <= now ? 'EXPIRED' : 'OPEN';
  return {
    state,
    customerFirstName: testimonialDisplayName(row.user.name, 'first'),
    serviceName: row.booking.service.name,
    visitedAt: row.booking.startsAt,
  };
}

export async function submitTestimonial(
  token: string,
  submission: TestimonialSubmission,
  now: Date = new Date(),
): Promise<SubmitTestimonialResult> {
  const row = await findByToken(token);
  if (!row?.user) return 'NOT_FOUND';
  if (row.status !== 'INVITED') return 'ALREADY_SUBMITTED';
  if (row.expiresAt <= now) return 'EXPIRED';

  const claimed = await prisma.testimonial.updateMany({
    where: { id: row.id, status: 'INVITED', expiresAt: { gt: now } },
    data: {
      status: 'SUBMITTED',
      rating: submission.rating,
      body: submission.body,
      displayName: testimonialDisplayName(row.user.name, submission.nameStyle),
      consentAt: now,
      submittedAt: now,
    },
  });
  return claimed.count === 1 ? 'SUBMITTED' : 'ALREADY_SUBMITTED';
}
