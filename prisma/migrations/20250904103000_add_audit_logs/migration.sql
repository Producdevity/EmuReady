-- Create Enums
CREATE TYPE "audit_action" AS ENUM ('CREATE','UPDATE','DELETE','ARCHIVE','APPROVE','REJECT','ASSIGN','UNASSIGN','BAN','UNBAN');

CREATE TYPE "audit_entity_type" AS ENUM (
  'USER',
  'USER_BAN',
  'LISTING',
  'PC_LISTING',
  'GAME',
  'PERMISSION',
  'COMMENT',
  'REPORT',
  'EMULATOR',
  'OTHER'
);

-- Create Table
CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" "audit_action" NOT NULL,
  "entityType" "audit_entity_type" NOT NULL,
  "entityId" TEXT,
  "targetUserId" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "requestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_targetUserId_idx" ON "audit_logs"("targetUserId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- FKs
ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

