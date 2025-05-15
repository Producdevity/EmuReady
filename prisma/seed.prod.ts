import { PrismaClient } from '@orm'
import performanceScalesSeeder from './seeders/performanceScalesSeeder'
import usersSeeder from './seeders/usersSeeder'
import systemsSeeder from './seeders/systemsSeeder'
import emulatorsSeeder from './seeders/emulatorsSeeder'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting production database seed...')

  await usersSeeder(prisma)
  await performanceScalesSeeder(prisma)
  await systemsSeeder(prisma)
  await emulatorsSeeder(prisma)

  console.log('Seeding completed successfully.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
