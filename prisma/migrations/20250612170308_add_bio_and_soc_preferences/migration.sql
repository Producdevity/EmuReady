-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "defaultToUserSocs" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "UserSocPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "socId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSocPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSocPreference_userId_idx" ON "UserSocPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSocPreference_userId_socId_key" ON "UserSocPreference"("userId", "socId");

-- AddForeignKey
ALTER TABLE "UserSocPreference" ADD CONSTRAINT "UserSocPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSocPreference" ADD CONSTRAINT "UserSocPreference_socId_fkey" FOREIGN KEY ("socId") REFERENCES "SoC"("id") ON DELETE CASCADE ON UPDATE CASCADE;
