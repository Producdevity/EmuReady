-- CreateEnum
CREATE TYPE "public"."ApiUsagePeriod" AS ENUM ('MINUTE', 'WEEK', 'MONTH');

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "prefix" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "monthlyQuota" INTEGER NOT NULL DEFAULT 10000,
    "weeklyQuota" INTEGER NOT NULL DEFAULT 2500,
    "burstQuota" INTEGER NOT NULL DEFAULT 100,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "isSystemKey" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_key_usage" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "period" "public"."ApiUsagePeriod" NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "firstRequestAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "lastRequestAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_prefix_key" ON "public"."api_keys"("prefix");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "public"."api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_isSystemKey_idx" ON "public"."api_keys"("isSystemKey");

-- CreateIndex
CREATE INDEX "api_key_usage_apiKeyId_period_idx" ON "public"."api_key_usage"("apiKeyId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_usage_apiKeyId_period_windowStart_key" ON "public"."api_key_usage"("apiKeyId", "period", "windowStart");

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_key_usage" ADD CONSTRAINT "api_key_usage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "public"."api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
