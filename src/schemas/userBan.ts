import { z } from 'zod'
import { SortDirection } from '@/schemas/soc'

export const UserBanSortField = z.enum(['bannedAt', 'expiresAt', 'isActive', 'reason'])

export const CreateUserBanSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  notes: z.string().optional(),
  expiresAt: z.date().optional(),
})

export const UpdateUserBanSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500).optional(),
  notes: z.string().optional(),
  expiresAt: z.date().optional(),
  isActive: z.boolean().optional(),
})

export const LiftUserBanSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().optional(),
})

export const GetUserBansSchema = z
  .object({
    search: z.string().optional(),
    isActive: z.boolean().optional(),
    sortField: UserBanSortField.optional(),
    sortDirection: SortDirection.optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
  })
  .optional()

export const GetUserBanByIdSchema = z.object({
  id: z.string().uuid(),
})

export const CheckUserBanStatusSchema = z.object({
  userId: z.string().uuid(),
})

export const DeleteUserBanSchema = z.object({
  id: z.string().uuid(),
})
