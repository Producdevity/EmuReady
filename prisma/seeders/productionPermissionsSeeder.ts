/**
 * Production-safe seeder for adding permission system data
 * This script only adds new permissions and role assignments
 * It will not modify or delete any existing data
 */

import { PrismaClient } from '@orm'
import permissionsSeeder from './permissionsSeeder'

const prisma = new PrismaClient()

async function main() {
  console.info('🔐 Starting production permissions seeder...')
  console.info('This will only add new permissions and assignments.')
  console.info('No existing data will be modified or deleted.\n')

  try {
    // Run the permissions seeder which uses upsert operations
    await permissionsSeeder(prisma)

    console.info('\n✅ Production permissions seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding production permissions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
