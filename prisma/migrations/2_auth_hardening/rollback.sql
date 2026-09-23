-- Manual rollback for 2_auth_hardening. Apply only after disabling the
-- corresponding application features.
DROP TABLE IF EXISTS "email_outbox";
DROP TABLE IF EXISTS "auth_device";
DROP TABLE IF EXISTS "security_event";
DROP TABLE IF EXISTS "twoFactor";
DROP TABLE IF EXISTS "rateLimit";
DROP INDEX IF EXISTS "account_providerId_accountId_key";
ALTER TABLE "user" DROP COLUMN IF EXISTS "twoFactorEnabled";
