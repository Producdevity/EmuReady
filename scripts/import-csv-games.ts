#!/usr/bin/env tsx

import { PrismaClient } from '@orm'
import csvGamesSeeder from '../prisma/seeders/csvGamesSeeder'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting CSV games import...')

  try {
    await csvGamesSeeder(prisma)
    console.log('🎉 CSV games import completed successfully!')
  } catch (error) {
    console.error('💥 CSV games import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
