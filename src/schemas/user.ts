import { Role } from '@orm'
import { z } from 'zod'

export const RegisterUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
})

export const GetUserByIdSchema = z.object({ userId: z.string().uuid() })

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  profileImage: z.string().optional(),
})

export const UpdateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum([Role.USER, Role.AUTHOR, Role.ADMIN]),
})

export const DeleteUserSchema = z.object({ userId: z.string().uuid() })
