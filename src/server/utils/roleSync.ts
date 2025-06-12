import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/server/db'
import type { Role } from '@orm'

/**
 * Syncs a user's role from database to Clerk publicMetadata
 * Database is the source of truth for roles
 */
export async function syncRoleToClerk(
  userId: string,
  role: Role,
): Promise<void> {
  try {
    const clerk = await clerkClient()

    // Get current user from database to get clerkId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clerkId: true },
    })

    if (!user) {
      throw new Error(`User with id ${userId} not found`)
    }

    // Update Clerk publicMetadata with the role
    await clerk.users.updateUserMetadata(user.clerkId, {
      publicMetadata: { role },
    })

    console.log(`Synced role ${role} to Clerk for user ${user.clerkId}`)
  } catch (error) {
    console.error('Failed to sync role to Clerk:', error)
    throw error
  }
}

/**
 * Updates a user's role in the database and syncs to Clerk
 */
export async function updateUserRole(
  userId: string,
  newRole: Role,
): Promise<void> {
  try {
    // Update role in database first (source of truth)
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    })

    // Then sync to Clerk
    await syncRoleToClerk(userId, newRole)
  } catch (error) {
    console.error('Failed to update user role:', error)
    throw error
  }
}

/**
 * Syncs all user roles from database to Clerk
 * Useful for initial setup or bulk operations
 */
export async function syncAllRolesToClerk(): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, clerkId: true, role: true },
    })

    console.log(`Syncing ${users.length} user roles to Clerk...`)

    const clerk = await clerkClient()

    for (const user of users) {
      try {
        await clerk.users.updateUserMetadata(user.clerkId, {
          publicMetadata: {
            role: user.role,
          },
        })
        console.log(`Synced role ${user.role} for user ${user.clerkId}`)
      } catch (error) {
        console.error(`Failed to sync role for user ${user.clerkId}:`, error)
      }
    }

    console.log('Finished syncing all roles to Clerk')
  } catch (error) {
    console.error('Failed to sync all roles to Clerk:', error)
    throw error
  }
}
