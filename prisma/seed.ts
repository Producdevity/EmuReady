import { PrismaClient } from '@orm'
import clearTestDataSeeder from './seeders/clearTestDataSeeder'
import cpuSeeder from './seeders/cpuSeeder'
import customFieldTemplatesSeeder from './seeders/customFieldTemplatesSeeder'
import devicesSeeder from './seeders/devicesSeeder'
import emulatorsSeeder from './seeders/emulatorsSeeder'
import gamesSeeder from './seeders/gamesSeeder'
import gpuSeeder from './seeders/gpuSeeder'
import listingsSeeder from './seeders/listingsSeeder'
import performanceScalesSeeder from './seeders/performanceScalesSeeder'
import permissionsSeeder from './seeders/permissionsSeeder'
import socSeeder from './seeders/socSeeder'
import systemsSeeder from './seeders/systemsSeeder'
import usersSeeder from './seeders/usersSeeder'

const prisma = new PrismaClient()

async function clearDb() {
  console.warn('🗑️ Clearing database...')
  console.warn('I hope you know what you are doing 😅')

  // Clear all data in the correct order (children before parents)
  await prisma.vote.deleteMany()
  await prisma.commentVote.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.listingCustomFieldValue.deleteMany()
  await prisma.pcListingCustomFieldValue.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.pcListing.deleteMany()
  await prisma.customFieldDefinition.deleteMany()
  await prisma.customFieldTemplateField.deleteMany()
  await prisma.customFieldTemplate.deleteMany()
  await prisma.performanceScale.deleteMany()
  await prisma.device.deleteMany()
  await prisma.cpu.deleteMany()
  await prisma.gpu.deleteMany()
  await prisma.soC.deleteMany()
  await prisma.emulator.deleteMany()
  await prisma.game.deleteMany()
  await prisma.system.deleteMany()
  await prisma.deviceBrand.deleteMany()
  // Clear permission system tables
  await prisma.permissionActionLog.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.permission.deleteMany()
}

async function main() {
  const args = process.argv.slice(2)
  const clearDbArg = args.includes('--clear')
  const clearDbTestDataArg = args.includes('--clear-test-data')
  const seedSocsOnly = args.includes('--socs-only')
  const seedDevicesOnly = args.includes('--devices-only')
  const seedEmulatorsOnly = args.includes('--emulators-only')
  const seedCustomFieldsOnly = args.includes('--custom-fields-only')
  const seedCpusOnly = args.includes('--cpus-only')
  const seedGpusOnly = args.includes('--gpus-only')

  if (clearDbTestDataArg) {
    console.info('🧹 Clearing test data only...')
    try {
      await clearTestDataSeeder(prisma)
      console.info('✅ Test data cleared successfully!')
    } catch (error) {
      console.error('❌ Error clearing test data:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
    return
  }

  if (seedSocsOnly) {
    console.info('🌱 Seeding SoCs only...')
    try {
      await socSeeder(prisma)
      console.info('✅ SoCs seeded successfully!')
    } catch (error) {
      console.error('❌ Error seeding SoCs:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
    return
  }

  if (seedDevicesOnly) {
    console.info('🌱 Seeding devices only...')
    try {
      await devicesSeeder(prisma)
      console.info('✅ Devices seeded successfully!')
    } catch (error) {
      console.error('❌ Error seeding devices:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
    return
  }

  if (seedEmulatorsOnly) {
    console.info('🌱 Seeding emulators only...')
    try {
      await emulatorsSeeder(prisma)
      console.info('✅ Emulators seeded successfully!')
    } catch (error) {
      console.error('❌ Error seeding emulators:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
    return
  }

  if (seedCustomFieldsOnly) {
    console.info('🌱 Seeding custom fields only...')
    try {
      await customFieldTemplatesSeeder(prisma)
      console.info('✅ Custom fields seeded successfully!')
    } catch (error) {
      console.error('❌ Error seeding custom fields:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
    return
  }

  if (seedCpusOnly) {
    console.info('🌱 Seeding CPUs only...')
    try {
      await cpuSeeder(prisma)
      console.info('✅ CPUs seeded successfully!')
    } catch (error) {
      console.error('❌ Error seeding CPUs:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
    return
  }

  if (seedGpusOnly) {
    console.info('🌱 Seeding GPUs only...')
    try {
      await gpuSeeder(prisma)
      console.info('✅ GPUs seeded successfully!')
    } catch (error) {
      console.error('❌ Error seeding GPUs:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
    return
  }

  if (clearDbArg) {
    console.warn('🗑️ Clearing database...')
    console.warn('I hope you know what you are doing 😅')

    // Clear all data in the correct order (children before parents)
    await clearDb()

    console.info('✅ Database cleared!')
  }

  console.info('🌱 Starting database seed...')

  try {
    // Seed in order of dependencies
    await permissionsSeeder(prisma) // Seed permissions first
    await performanceScalesSeeder(prisma)
    await systemsSeeder(prisma)
    await usersSeeder(prisma)
    await emulatorsSeeder(prisma)
    await customFieldTemplatesSeeder(prisma)
    await socSeeder(prisma)
    await cpuSeeder(prisma)
    await gpuSeeder(prisma)
    await devicesSeeder(prisma)
    await gamesSeeder(prisma)
    await listingsSeeder(prisma)

    console.info('✅ Database seeded successfully!')
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
