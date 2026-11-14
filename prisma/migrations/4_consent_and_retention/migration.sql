
ALTER TABLE "user" ADD COLUMN "termsAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN "marketingOptIn" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "ConsentKind" AS ENUM ('TERMS', 'PRIVACY_NOTICE', 'COOKIE_NOTICE', 'MARKETING');

CREATE TABLE "consent_record" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "kind" "ConsentKind" NOT NULL,
    "version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_record_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consent_record_userId_kind_createdAt_idx" ON "consent_record"("userId", "kind", "createdAt");

ALTER TABLE "consent_record" ADD CONSTRAINT "consent_record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "booking" DROP CONSTRAINT "booking_userId_fkey";
ALTER TABLE "booking" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "booking" ADD CONSTRAINT "booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
