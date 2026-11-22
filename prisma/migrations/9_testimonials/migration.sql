CREATE TYPE "TestimonialStatus" AS ENUM ('INVITED', 'SUBMITTED', 'PUBLISHED', 'HIDDEN');

CREATE TABLE "testimonial" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'INVITED',
    "rating" INTEGER,
    "body" TEXT,
    "displayName" TEXT,
    "consentAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "testimonial_photo" (
    "id" TEXT NOT NULL,
    "testimonialId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonial_photo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "testimonial_bookingId_key" ON "testimonial"("bookingId");

CREATE UNIQUE INDEX "testimonial_tokenHash_key" ON "testimonial"("tokenHash");

CREATE INDEX "testimonial_status_publishedAt_idx" ON "testimonial"("status", "publishedAt");

CREATE INDEX "testimonial_userId_idx" ON "testimonial"("userId");

CREATE INDEX "testimonial_photo_testimonialId_position_idx" ON "testimonial_photo"("testimonialId", "position");

ALTER TABLE "testimonial" ADD CONSTRAINT "testimonial_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "testimonial" ADD CONSTRAINT "testimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "testimonial_photo" ADD CONSTRAINT "testimonial_photo_testimonialId_fkey" FOREIGN KEY ("testimonialId") REFERENCES "testimonial"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "testimonial" ADD CONSTRAINT "testimonial_rating_range" CHECK ("rating" IS NULL OR ("rating" BETWEEN 1 AND 5));
