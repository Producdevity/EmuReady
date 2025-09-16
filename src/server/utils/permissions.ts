import { prisma } from '@/server/db'
import { hasRolePermission } from '@/utils/permissions'
import { type PrismaClient, Role } from '@orm'

/**
 * Checks if a user is a verified developer for a specific emulator
 * This is used to restrict developer access to only their emulators
 *
 * @param userId - The ID of the user to check
 * @param emulatorId - The ID of the emulator to check against
 * @param prismaClient - Prisma client instance (optional, will use the default db client if not provided)
 * @returns Promise resolving to boolean indicating if the user has access
 */
export async function hasDeveloperAccessToEmulator(
  userId: string,
  emulatorId: string,
  prismaClient?: PrismaClient,
): Promise<boolean> {
  const db = prismaClient || prisma

  // First check if the user exists and has appropriate role
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user) return false

  // If user is ADMIN or SUPER_ADMIN, they automatically have access to all emulators
  if (hasRolePermission(user.role, Role.ADMIN)) return true

  // For DEVELOPER role, check if they are verified for this specific emulator
  if (user.role === Role.DEVELOPER) {
    const verifiedDeveloper = await db.verifiedDeveloper.findUnique({
      where: {
        userId_emulatorId: {
          userId,
          emulatorId,
        },
      },
    })

    return !!verifiedDeveloper
  }

  // All other roles don't have access
  return false
}
