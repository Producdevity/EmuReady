import { z } from 'zod'
import { logger } from '@/lib/logger'
import { AuditLogsRepository } from '@/server/repositories/audit-logs.repository'
import { type AuditAction, type AuditEntityType, type Prisma, type PrismaClient } from '@orm'

const MetadataSchema = z.record(z.string(), z.unknown()).optional()

function extractRequestMeta(headers?: Headers | Record<string, string>) {
  try {
    const get = (key: string) => {
      if (!headers) return undefined
      if (headers instanceof Headers) return headers.get(key) || undefined
      const val = (headers as Record<string, string>)[key]
      return val || undefined
    }

    const forwardedFor = get('x-forwarded-for')
    const ip = get('x-real-ip') || (forwardedFor ? forwardedFor.split(',')[0]?.trim() : undefined)
    const userAgent = get('user-agent')
    const requestId = get('x-request-id') || get('request-id')

    return { ipAddress: ip, userAgent, requestId }
  } catch {
    return { ipAddress: undefined, userAgent: undefined, requestId: undefined }
  }
}

type Params = {
  actorId?: string
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string
  targetUserId?: string
  metadata?: Record<string, unknown>
  headers?: Headers | Record<string, string>
}

export async function logAudit(prisma: PrismaClient, params: Params): Promise<void> {
  const { actorId, action, entityType, entityId, targetUserId, metadata, headers } = params

  const meta = extractRequestMeta(headers)
  const safeMetadata = MetadataSchema.parse(metadata) as Prisma.InputJsonValue | undefined

  try {
    const repository = new AuditLogsRepository(prisma)
    await repository.create({
      actorId,
      action,
      entityType,
      entityId,
      targetUserId,
      metadata: safeMetadata ?? null,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
      requestId: meta.requestId ?? null,
    })
  } catch (err) {
    // Never block the main flow on audit failures
    logger.error('[audit.service] failed to write audit log', err)
  }
}

export function buildDiff(prev: unknown, next: unknown) {
  try {
    return { prev, next }
  } catch {
    return undefined
  }
}
