-- AddColumn
ALTER TABLE "user" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Enforce one owner for each external provider identity.
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- Shared, atomic rate-limit counters used by Better Auth and identity throttles.
CREATE TABLE "rateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,
    CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");

-- TOTP secrets and backup codes are encrypted by Better Auth before persistence.
CREATE TABLE "twoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "failedVerificationCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor"("secret");
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor"("userId");
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Append-only authentication and security audit trail.
CREATE TABLE "security_event" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "userId" TEXT,
    "actorHash" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_event_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "security_event_event_outcome_createdAt_idx"
    ON "security_event"("event", "outcome", "createdAt");
CREATE INDEX "security_event_userId_createdAt_idx"
    ON "security_event"("userId", "createdAt");
CREATE INDEX "security_event_createdAt_idx" ON "security_event"("createdAt");
ALTER TABLE "security_event" ADD CONSTRAINT "security_event_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Known devices support new-device detection without retaining raw IP addresses.
CREATE TABLE "auth_device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_device_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "auth_device_userId_fingerprint_key"
    ON "auth_device"("userId", "fingerprint");
CREATE INDEX "auth_device_userId_lastSeenAt_idx"
    ON "auth_device"("userId", "lastSeenAt");
ALTER TABLE "auth_device" ADD CONSTRAINT "auth_device_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Email addresses and action links are encrypted in the application before storage.
CREATE TABLE "email_outbox" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "encryptedPayload" TEXT,
    "recipientHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "email_outbox_status_nextAttemptAt_idx"
    ON "email_outbox"("status", "nextAttemptAt");
CREATE INDEX "email_outbox_recipientHash_createdAt_idx"
    ON "email_outbox"("recipientHash", "createdAt");
