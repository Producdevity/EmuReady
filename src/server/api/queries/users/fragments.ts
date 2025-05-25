import type { Prisma } from '@orm'

// Basic user selection for admin/internal use
export const userBasicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect

// Public user data (for comments, listings, etc.)
export const userPublicSelect = {
  id: true,
  name: true,
  profileImage: true,
} satisfies Prisma.UserSelect

// Full profile data (for user's own profile)
export const userProfileSelect = {
  ...userBasicSelect,
  profileImage: true,
} satisfies Prisma.UserSelect

// User with activity counts (for admin dashboard)
export const userWithCountsSelect = {
  ...userBasicSelect,
  _count: {
    select: {
      listings: true,
      votes: true,
      comments: true,
    },
  },
} satisfies Prisma.UserSelect
