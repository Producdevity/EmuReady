import { z } from 'zod'
import { Role, PermissionActionType } from '@orm'

// Sorting and filtering schemas
export const PermissionSortField = z.enum([
  'label',
  'key',
  'category',
  'createdAt',
  'updatedAt',
])

export const SortDirection = z.enum(['asc', 'desc'])

export const PermissionCategory = z.enum([
  'CONTENT',
  'MODERATION',
  'USER_MANAGEMENT',
  'SYSTEM',
])

// Get all permissions schema
export const GetAllPermissionsSchema = z
  .object({
    search: z.string().optional(),
    category: PermissionCategory.optional(),
    sortField: PermissionSortField.optional(),
    sortDirection: SortDirection.optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(50),
    includeSystemOnly: z.boolean().optional(),
  })
  .optional()

// Permission CRUD schemas
export const CreatePermissionSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z_]+$/,
      'Key must only contain lowercase letters and underscores',
    ),
  label: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: PermissionCategory,
  isSystem: z.boolean().default(false),
})

export const UpdatePermissionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: PermissionCategory.optional(),
})

export const DeletePermissionSchema = z.object({
  id: z.string().uuid(),
})

export const GetPermissionByIdSchema = z.object({
  id: z.string().uuid(),
})

// Role permission assignment schemas
export const GetRolePermissionsSchema = z.object({
  role: z.nativeEnum(Role).optional(),
})

export const AssignPermissionToRoleSchema = z.object({
  role: z.nativeEnum(Role),
  permissionId: z.string().uuid(),
})

export const RemovePermissionFromRoleSchema = z.object({
  role: z.nativeEnum(Role),
  permissionId: z.string().uuid(),
})

export const BulkUpdateRolePermissionsSchema = z.object({
  role: z.nativeEnum(Role),
  permissionIds: z.array(z.string().uuid()),
})

// Permission logs schemas
export const PermissionLogSortField = z.enum([
  'createdAt',
  'action',
  'userId',
  'targetRole',
])

export const GetPermissionLogsSchema = z
  .object({
    userId: z.string().uuid().optional(),
    action: z.nativeEnum(PermissionActionType).optional(),
    targetRole: z.nativeEnum(Role).optional(),
    permissionId: z.string().uuid().optional(),
    sortField: PermissionLogSortField.optional(),
    sortDirection: SortDirection.optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  })
  .optional()

// Permission matrix schema for UI
export const GetPermissionMatrixSchema = z
  .object({
    includeSystemPermissions: z.boolean().default(true),
  })
  .optional()

// Validation schemas for role restrictions
export const ValidateRolePermissionSchema = z.object({
  role: z.nativeEnum(Role),
  permissionKey: z.string(),
})

// User permission check schema
export const CheckUserPermissionSchema = z.object({
  userId: z.string().uuid(),
  permissionKey: z.string(),
})

// Bulk operations for admin dashboard
export const BulkPermissionActionSchema = z.object({
  action: z.enum(['assign', 'remove']),
  rolePermissions: z.array(
    z.object({
      role: z.nativeEnum(Role),
      permissionId: z.string().uuid(),
    }),
  ),
})

// Export types for TypeScript
export type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>
export type UpdatePermissionInput = z.infer<typeof UpdatePermissionSchema>
export type GetAllPermissionsInput = z.infer<typeof GetAllPermissionsSchema>
export type GetRolePermissionsInput = z.infer<typeof GetRolePermissionsSchema>
export type AssignPermissionToRoleInput = z.infer<
  typeof AssignPermissionToRoleSchema
>
export type RemovePermissionFromRoleInput = z.infer<
  typeof RemovePermissionFromRoleSchema
>
export type BulkUpdateRolePermissionsInput = z.infer<
  typeof BulkUpdateRolePermissionsSchema
>
export type GetPermissionLogsInput = z.infer<typeof GetPermissionLogsSchema>
export type GetPermissionMatrixInput = z.infer<typeof GetPermissionMatrixSchema>
export type BulkPermissionActionInput = z.infer<
  typeof BulkPermissionActionSchema
>

// Additional permission log schemas
export const GetPermissionLogByIdSchema = z.object({
  id: z.string().uuid(),
})

export const GetPermissionTimelineSchema = z.object({
  permissionId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(50),
})

export const GetUserPermissionActivitySchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(50),
})

export const ExportPermissionLogsSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
  action: z.nativeEnum(PermissionActionType).optional(),
})

// Export additional types
export type GetPermissionLogByIdInput = z.infer<
  typeof GetPermissionLogByIdSchema
>
export type GetPermissionTimelineInput = z.infer<
  typeof GetPermissionTimelineSchema
>
export type GetUserPermissionActivityInput = z.infer<
  typeof GetUserPermissionActivitySchema
>
export type ExportPermissionLogsInput = z.infer<
  typeof ExportPermissionLogsSchema
>
