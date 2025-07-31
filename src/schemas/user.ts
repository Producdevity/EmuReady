import { z } from 'zod'
import { PAGINATION, CHAR_LIMITS } from '@/data/constants'
import { Role } from '@orm'

export const UserSortField = z.enum([
  'name',
  'email',
  'role',
  'createdAt',
  'listingsCount',
  'votesCount',
  'commentsCount',
  'trustScore',
])
export const SortDirection = z.enum(['asc', 'desc'])

export const GetAllUsersSchema = z
  .object({
    search: z.string().optional(),
    sortField: UserSortField.optional(),
    sortDirection: SortDirection.optional(),
    page: z.number().int().min(1).default(1),
    limit: z
      .number()
      .int()
      .min(1)
      .max(PAGINATION.MAX_LIMIT)
      .default(PAGINATION.DEFAULT_LIMIT),
  })
  .optional()

export const RegisterUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export const GetUserByIdSchema = z.object({
  userId: z.string().uuid(),
  // Pagination for listings
  listingsPage: z.number().int().min(1).default(1),
  listingsLimit: z.number().int().min(1).max(50).default(12),
  listingsSearch: z.string().optional(),
  listingsSystem: z.string().optional(),
  listingsEmulator: z.string().optional(),
  // Pagination for votes
  votesPage: z.number().int().min(1).default(1),
  votesLimit: z.number().int().min(1).max(50).default(12),
  votesSearch: z.string().optional(),
})

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  profileImage: z.string().url().optional(),
  bio: z.string().max(CHAR_LIMITS.DESCRIPTION).optional(),
})

export const UpdateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(Role),
})

export const DeleteUserSchema = z.object({
  userId: z.string().uuid(),
})

export const SearchUsersSchema = z.object({
  query: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
  minRole: z.nativeEnum(Role).optional(),
})
