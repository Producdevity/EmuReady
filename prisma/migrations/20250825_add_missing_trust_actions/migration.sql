-- Add missing trust action enum values that were added via db push but never migrated
-- These values already exist in dev/staging but are missing from production

ALTER TYPE "trust_action" ADD VALUE IF NOT EXISTS 'LISTING_DEVELOPER_VERIFIED';
ALTER TYPE "trust_action" ADD VALUE IF NOT EXISTS 'COMMENT_RECEIVED_UPVOTE';
ALTER TYPE "trust_action" ADD VALUE IF NOT EXISTS 'COMMENT_RECEIVED_DOWNVOTE';
ALTER TYPE "trust_action" ADD VALUE IF NOT EXISTS 'REPORT_CONFIRMED';
ALTER TYPE "trust_action" ADD VALUE IF NOT EXISTS 'FALSE_REPORT';
ALTER TYPE "trust_action" ADD VALUE IF NOT EXISTS 'GAME_SUBMISSION_APPROVED';
ALTER TYPE "trust_action" ADD VALUE IF NOT EXISTS 'GAME_SUBMISSION_REJECTED';
ALTER TYPE "trust_action" ADD VALUE IF NOT EXISTS 'HELPFUL_COMMENT';