
ALTER TABLE "service" ADD COLUMN "category" TEXT;
ALTER TABLE "service" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "service_category_sortOrder_idx" ON "service"("category", "sortOrder");
