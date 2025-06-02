import { Role } from '@orm'
import { z } from 'zod'

export const UserSortField = z.enum([
  'name',
  'email',
  'role',
  'createdAt',
  'listingsCount',
  'votesCount',
  'commentsCount',
])
export const SortDirection = z.enum(['asc', 'desc'])

export const GetAllUsersSchema = z
  .object({
    search: z.string().optional(),
    sortField: UserSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()

export const RegisterUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export const GetUserByIdSchema = z.object({
  userId: z.string().uuid(),
})

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  profileImage: z.string().url().optional(),
})

export const UpdateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(Role),
})

export const DeleteUserSchema = z.object({
  userId: z.string().uuid(),
})
