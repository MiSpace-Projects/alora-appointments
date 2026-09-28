-- Catalog price shapes: a fixed price, a "from" floor, or a low-high range.
-- priceCents stays the charged/lower amount; priceMaxCents is the upper bound
-- of a RANGE. Online pay-now is restricted to FIXED prices in application code.

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'FROM', 'RANGE');

-- AlterTable
ALTER TABLE "service" ADD COLUMN "priceType" "PriceType" NOT NULL DEFAULT 'FIXED';
ALTER TABLE "service" ADD COLUMN "priceMaxCents" INTEGER;
