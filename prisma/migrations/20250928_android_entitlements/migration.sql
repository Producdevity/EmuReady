-- Android Distribution: Entitlements & Releases
-- NOTE: This migration was authored manually to avoid touching live DBs during planning.
-- Apply with: npm run db:migrate:deploy (after validating in staging).

-- Enums
DO $$ BEGIN
  CREATE TYPE "EntitlementSource" AS ENUM ('PLAY', 'PATREON', 'MANUAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "Entitlement" (
  "id"           TEXT PRIMARY KEY,
  "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "source"       "EntitlementSource" NOT NULL,
  "status"       "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
  "referenceId"  TEXT,
  "amountCents"  INTEGER,
  "currency"     TEXT,
  "grantedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "revokedAt"    TIMESTAMP WITH TIME ZONE,
  "notes"        TEXT
);

CREATE INDEX IF NOT EXISTS "Entitlement_userId_idx" ON "Entitlement" ("userId");
CREATE INDEX IF NOT EXISTS "Entitlement_source_referenceId_idx" ON "Entitlement" ("source", "referenceId");

CREATE TABLE IF NOT EXISTS "Release" (
  "id"           TEXT PRIMARY KEY,
  "channel"      TEXT NOT NULL,
  "versionCode"  INTEGER NOT NULL,
  "versionName"  TEXT NOT NULL,
  "fileKey"      TEXT NOT NULL,
  "fileSha256"   TEXT NOT NULL,
  "sizeBytes"    BIGINT NOT NULL,
  "createdAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "notes"        TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "Release_channel_versionCode_key" ON "Release" ("channel", "versionCode");
CREATE INDEX IF NOT EXISTS "Release_createdAt_idx" ON "Release" ("createdAt");

CREATE TABLE IF NOT EXISTS "Download" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "releaseId"   TEXT NOT NULL REFERENCES "Release"("id") ON DELETE CASCADE,
  "ip"          TEXT,
  "userAgent"   TEXT,
  "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Download_userId_createdAt_idx" ON "Download" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Download_releaseId_idx" ON "Download" ("releaseId");

CREATE TABLE IF NOT EXISTS "ExternalAccount" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "provider"    TEXT NOT NULL,
  "externalId"  TEXT NOT NULL,
  "email"       TEXT,
  "linkedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "data"        JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExternalAccount_provider_externalId_key" ON "ExternalAccount" ("provider", "externalId");
CREATE INDEX IF NOT EXISTS "ExternalAccount_userId_idx" ON "ExternalAccount" ("userId");

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
  "id"          TEXT PRIMARY KEY,
  "source"      TEXT NOT NULL,
  "eventId"     TEXT NOT NULL,
  "payload"     JSONB NOT NULL,
  "status"      TEXT NOT NULL,
  "error"       TEXT,
  "processedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEvent_source_eventId_key" ON "WebhookEvent" ("source", "eventId");

