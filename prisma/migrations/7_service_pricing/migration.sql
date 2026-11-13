
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'FROM', 'RANGE');

ALTER TABLE "service" ADD COLUMN "priceType" "PriceType" NOT NULL DEFAULT 'FIXED';
ALTER TABLE "service" ADD COLUMN "priceMaxCents" INTEGER;
