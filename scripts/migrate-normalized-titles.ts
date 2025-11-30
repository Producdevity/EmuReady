/**
 * Data Migration Script: Populate normalizedTitle for existing games
 *
 * This script should be run AFTER the schema migration that adds the normalizedTitle column.
 * If you are running the migration and seeders for the first time you can skip this step.
 * It populates the normalizedTitle field for all existing Game records.
 *
 * Usage:
 *   npm run db:migrate:deploy  # First, apply the schema migration
 *   npx tsx scripts/migrate-normalized-titles.ts  # Then, run this script (loads .env.local automatically)
 *
 * Or use the db-cmd wrapper:
 *   ./scripts/db-cmd.sh npx tsx scripts/migrate-normalized-titles.ts
 */

import { config } from 'dotenv'
import { normalizeString } from '@/utils/text'
import { PrismaClient } from '@orm'

// Load environment variables from .env.local (same as db-cmd.sh does)
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function migrateNormalizedTitles() {
  console.log('Starting normalizedTitle migration...')

  try {
    // Get all games that don't have a normalizedTitle set
    const games = await prisma.game.findMany({
      where: { OR: [{ normalizedTitle: null }, { normalizedTitle: '' }] },
      select: { id: true, title: true },
    })

    console.log(`Found ${games.length} games without normalizedTitle`)

    if (games.length === 0) {
      console.log('No games to migrate. Exiting.')
      return
    }

    // Update games in batches to avoid overwhelming the database
    const BATCH_SIZE = 100
    let updated = 0

    for (let i = 0; i < games.length; i += BATCH_SIZE) {
      const batch = games.slice(i, i + BATCH_SIZE)

      // Use transaction for batch updates
      await prisma.$transaction(
        batch.map((game) =>
          prisma.game.update({
            where: { id: game.id },
            data: { normalizedTitle: normalizeString(game.title) },
          }),
        ),
      )

      updated += batch.length
      console.log(`Progress: ${updated}/${games.length} games updated`)
    }

    console.log(`✅ Successfully migrated ${updated} games`)

    // Verify the migration
    const remaining = await prisma.game.count({
      where: {
        OR: [{ normalizedTitle: null }, { normalizedTitle: '' }],
      },
    })

    if (remaining > 0) {
      console.warn(`⚠️  Warning: ${remaining} games still have empty normalizedTitle`)
    } else {
      console.log('✅ All games have normalizedTitle populated')
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateNormalizedTitles()
  .then(() => {
    console.log('Migration completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
