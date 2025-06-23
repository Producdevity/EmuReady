-- This is an empty migration.

-- Drop the unique constraint on gameId, deviceId, emulatorId in the Listing table
-- This allows multiple listings for the same game/device/emulator combination
ALTER TABLE "Listing" DROP CONSTRAINT IF EXISTS "Listing_gameId_deviceId_emulatorId_key";