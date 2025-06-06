import { prisma } from '@/server/db'
import { auth } from '@clerk/nextjs/server'
import type { Role } from '@orm'
import type { Nullable } from '@/types/utils'

interface User {
  id: string
  email: string
  name: Nullable<string>
  role: Role
}

/**
 * Get the current authenticated user from the database.
 * Returns null if not authenticated or user not found.
 * This function is designed for use in server components.
 */
export async function getCurrentUser(): Promise<Nullable<User>> {
  const { userId } = await auth()

  if (!userId) return null

  return prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })
}
