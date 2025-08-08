import { z } from 'zod'

// TailwindColor enum values for validation
const TAILWIND_COLORS = [
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
] as const

export const CreateBadgeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or less'),
  description: z
    .string()
    .max(200, 'Description must be 200 characters or less')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .default('#3B82F6'),
  icon: z.string().max(50, 'Icon must be 50 characters or less').optional(),
})

export const UpdateBadgeSchema = z.object({
  id: z.string().uuid('Invalid badge ID'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or less')
    .optional(),
  description: z
    .string()
    .max(200, 'Description must be 200 characters or less')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .optional(),
  icon: z.string().max(50, 'Icon must be 50 characters or less').optional(),
  isActive: z.boolean().optional(),
})

export const DeleteBadgeSchema = z.object({
  id: z.string().uuid('Invalid badge ID'),
})

export const GetBadgeSchema = z.object({
  id: z.string().uuid('Invalid badge ID'),
})

export const GetBadgesSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  sortField: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
})

// User badge assignment schemas
export const AssignBadgeToUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  badgeId: z.string().uuid('Invalid badge ID'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  color: z.enum(TAILWIND_COLORS).default('blue'),
})

export const RemoveBadgeFromUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  userBadgeId: z.string().uuid('Invalid user badge ID'),
})

export const GetUserBadgesSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

export const RemoveBadgeByIdSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  badgeId: z.string().uuid('Invalid badge ID'),
})

export const BulkAssignBadgesSchema = z.object({
  userIds: z
    .array(z.string().uuid('Invalid user ID'))
    .min(1, 'At least one user ID is required'),
  badgeId: z.string().uuid('Invalid badge ID'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  color: z.enum(TAILWIND_COLORS).default('blue'),
})

export const BulkRemoveBadgesSchema = z.object({
  userIds: z
    .array(z.string().uuid('Invalid user ID'))
    .min(1, 'At least one user ID is required'),
  badgeId: z.string().uuid('Invalid badge ID'),
})
