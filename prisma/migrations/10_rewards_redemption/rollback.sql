ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "booking_discount_within_price";
ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "booking_points_redeemed_non_negative";
ALTER TABLE "booking" DROP COLUMN IF EXISTS "pointsRedeemed";
ALTER TABLE "booking" DROP COLUMN IF EXISTS "discountCents";

UPDATE "points_transaction" SET "reason" = 'ADJUSTMENT' WHERE "reason" IN ('REDEMPTION_REVERSED', 'EXPIRED');

ALTER TYPE "PointsReason" RENAME TO "PointsReason_old";
CREATE TYPE "PointsReason" AS ENUM ('EARNED_BOOKING', 'REDEEMED', 'SIGNUP_BONUS', 'ADJUSTMENT');
ALTER TABLE "points_transaction" ALTER COLUMN "reason" TYPE "PointsReason" USING ("reason"::text::"PointsReason");
DROP TYPE "PointsReason_old";
