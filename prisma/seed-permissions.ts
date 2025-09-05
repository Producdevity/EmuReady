import { PrismaClient } from '@orm'
import { permissionsSeederAddOnly } from './seeders/permissionsSeeder'

/**
 * Script to seed ONLY permissions and role-permission links.
 * - Additive-only: will not update existing permissions or remove links
 * - Safe for development and production
 */
async function main() {
  const prisma = new PrismaClient()
  try {
    await permissionsSeederAddOnly(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
