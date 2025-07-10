-- CreateEnum
CREATE TYPE "TailwindColor" AS ENUM ('yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone');

-- CreateEnum
CREATE TYPE "PermissionCategory" AS ENUM ('CONTENT', 'MODERATION', 'USER_MANAGEMENT', 'SYSTEM');

-- AlterTable
ALTER TABLE "user_badges" ADD COLUMN     "color" "TailwindColor" NOT NULL DEFAULT 'blue';
