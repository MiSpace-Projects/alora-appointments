DROP INDEX IF EXISTS "points_transaction_bookingId_reason_key";

ALTER TABLE "payment" DROP COLUMN IF EXISTS "pendingRefundCents";
