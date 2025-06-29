-- This is an empty migration that acknowledges the MODERATOR and DEVELOPER roles
-- that were added directly to the database.
-- These roles are already present in the Role enum in the database.
-- This migration is just to bring the migration history in sync with the database state.

-- This migration acknowledges that the MODERATOR and DEVELOPER roles
-- are already present in the database. The ALTER TYPE statements are
-- idempotent (they only add the values if they don't exist).

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MODERATOR';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DEVELOPER'; 