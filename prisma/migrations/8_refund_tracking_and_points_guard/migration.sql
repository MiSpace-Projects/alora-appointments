ALTER TABLE "payment" ADD COLUMN "pendingRefundCents" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "points_transaction_bookingId_reason_key" ON "points_transaction"("bookingId", "reason");
