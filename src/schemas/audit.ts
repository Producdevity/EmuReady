import { z } from 'zod'
import { AuditAction, AuditEntityType } from '@orm'

export const SortDirection = z.enum(['asc', 'desc'])

export const AuditLogSortField = z.enum([
  'createdAt',
  'action',
  'entityType',
  'actorId',
  'targetUserId',
])

export const GetAuditLogsSchema = z
  .object({
    search: z.string().optional(),
    action: z.nativeEnum(AuditAction).optional(),
    entityType: z.nativeEnum(AuditEntityType).optional(),
    actorId: z.string().uuid().optional(),
    targetUserId: z.string().uuid().optional(),
    sortField: AuditLogSortField.optional(),
    sortDirection: SortDirection.optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(50),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  })
  .optional()

export const GetAuditLogByIdSchema = z.object({ id: z.string().uuid() })

export type GetAuditLogsInput = z.infer<typeof GetAuditLogsSchema>
export type GetAuditLogByIdInput = z.infer<typeof GetAuditLogByIdSchema>
