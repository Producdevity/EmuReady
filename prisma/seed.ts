import { PrismaClient } from '@orm'
import devicesSeeder from './seeders/devicesSeeder'
import emulatorsSeeder from './seeders/emulatorsSeeder'
import systemsSeeder from './seeders/systemsSeeder'
import performanceScalesSeeder from './seeders/performanceScalesSeeder'
import usersSeeder from './seeders/usersSeeder'
import gamesSeeder from './seeders/gamesSeeder'
import listingsSeeder from './seeders/listingsSeeder'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  const clearDb = args.includes('--clear')

  if (clearDb) {
    console.warn('🗑️ Clearing database...')
    console.warn('I hope you know what you are doing 😅')

    // Clear all data in the correct order (children before parents)
    await prisma.vote.deleteMany()
    await prisma.commentVote.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.listingCustomFieldValue.deleteMany()
    await prisma.listing.deleteMany()
    await prisma.customFieldDefinition.deleteMany()
    await prisma.performanceScale.deleteMany()
    await prisma.device.deleteMany()
    await prisma.emulator.deleteMany()
    await prisma.game.deleteMany()
    await prisma.system.deleteMany()
    await prisma.deviceBrand.deleteMany()
    await prisma.user.deleteMany()

    console.log('✅ Database cleared!')
  }

  console.log('🌱 Starting database seed...')

  try {
    // Seed in order of dependencies
    await performanceScalesSeeder(prisma)
    await systemsSeeder(prisma)
    await usersSeeder(prisma)
    await emulatorsSeeder(prisma)
    await devicesSeeder(prisma)
    await gamesSeeder(prisma)
    await listingsSeeder(prisma)

    console.log('✅ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
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
