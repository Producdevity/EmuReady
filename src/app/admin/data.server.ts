import 'server-only'

import { prisma } from '@/server/db'
import { getDeveloperNavItems, type AdminNavItem } from './data'

export async function getDeveloperNavItemsForUser(userId: string): Promise<AdminNavItem[]> {
  const verifiedEmulators = await prisma.verifiedDeveloper.findMany({
    where: { userId },
    select: { emulatorId: true },
  })

  const emulatorIds = verifiedEmulators.map((verifiedEmulator) => verifiedEmulator.emulatorId)
  return getDeveloperNavItems(emulatorIds)
}
