import { prisma } from '@/server/db'
import { userProfileSelect, userPublicSelect } from './fragments'
import { userListingsSelect } from '../listings/fragments'
import { userVotesSelect } from '../votes/fragments'

// Get user's own profile data
export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userProfileSelect,
      listings: {
        select: userListingsSelect,
        orderBy: { createdAt: 'desc' as const },
      },
      votes: {
        select: userVotesSelect,
      },
    },
  })
}

// Get public user data (for user pages)
export async function getPublicUserData(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userPublicSelect,
      role: true,
      createdAt: true,
      listings: {
        select: userListingsSelect,
        where: { status: 'APPROVED' }, // Only show approved listings on public profiles
        orderBy: { createdAt: 'desc' as const },
      },
      votes: {
        select: userVotesSelect,
      },
    },
  })
}

// Check if user exists (lightweight check)
export async function userExists(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  return !!user
}
