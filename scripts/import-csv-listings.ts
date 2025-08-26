#!/usr/bin/env tsx

import { PrismaClient } from '@orm'
import csvListingsSeeder from '../prisma/seeders/csvListingsSeeder'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting CSV listings import...')

  try {
    await csvListingsSeeder(prisma)
    console.log('🎉 CSV listings import completed successfully!')
  } catch (error) {
    console.error('💥 CSV listings import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
