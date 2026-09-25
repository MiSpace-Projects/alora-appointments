-- Public price list grouping and ordering for the service catalog.

-- AlterTable
ALTER TABLE "service" ADD COLUMN "category" TEXT;
ALTER TABLE "service" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "service_category_sortOrder_idx" ON "service"("category", "sortOrder");
