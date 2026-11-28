ALTER TYPE "PointsReason" ADD VALUE 'REDEMPTION_REVERSED';
ALTER TYPE "PointsReason" ADD VALUE 'EXPIRED';

ALTER TABLE "booking" ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "pointsRedeemed" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "booking" ADD CONSTRAINT "booking_points_redeemed_non_negative" CHECK ("pointsRedeemed" >= 0);
ALTER TABLE "booking" ADD CONSTRAINT "booking_discount_within_price" CHECK ("discountCents" >= 0 AND "discountCents" <= "priceCents");
