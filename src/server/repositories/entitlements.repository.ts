import { AppError, ResourceError } from '@/lib/errors'
import { hasRolePermission } from '@/utils/permissions'
import { type Prisma, EntitlementStatus, type EntitlementSource, Role } from '@orm'
import { BaseRepository } from './base.repository'

export class EntitlementsRepository extends BaseRepository {
  static readonly includes = {
    minimal: {} satisfies Prisma.EntitlementInclude,
  } as const

  async listActiveByUser(userId: string) {
    return this.prisma.entitlement.findMany({
      where: { userId, status: EntitlementStatus.ACTIVE },
      orderBy: { grantedAt: 'asc' },
      include: EntitlementsRepository.includes.minimal,
    })
  }

  async eligible(userId: string): Promise<boolean> {
    const count = await this.prisma.entitlement.count({
      where: { userId, status: EntitlementStatus.ACTIVE },
    })
    return count > 0
  }

  async grant(
    userId: string,
    source: EntitlementSource,
    data?: { referenceId?: string; amountCents?: number; currency?: string; notes?: string },
  ) {
    if (!userId) return ResourceError.user.notFound()
    if (data?.referenceId) {
      const dup = await this.prisma.entitlement.findFirst({
        where: { source, referenceId: data.referenceId, status: EntitlementStatus.ACTIVE },
        select: { id: true, userId: true },
      })
      if (dup && dup.userId !== userId) {
        return AppError.conflict('Reference already claimed by another user')
      }
    }
    return this.handleDatabaseOperation(
      () =>
        this.prisma.entitlement.create({
          data: {
            userId,
            source,
            status: EntitlementStatus.ACTIVE,
            referenceId: data?.referenceId ?? null,
            amountCents: data?.amountCents ?? null,
            currency: data?.currency ?? null,
            notes: data?.notes ?? null,
          },
        }),
      'Entitlement',
    )
  }

  async revoke(entitlementId: string, options?: { requestingUserRole?: Role }) {
    if (!entitlementId) return AppError.notFound('Entitlement')
    const exists = await this.prisma.entitlement.findUnique({ where: { id: entitlementId } })
    if (!exists) return AppError.notFound('Entitlement')

    const canAdmin = hasRolePermission(options?.requestingUserRole, Role.ADMIN)
    if (!canAdmin) return AppError.forbidden('You do not have permission to revoke entitlements')

    return this.handleDatabaseOperation(
      () =>
        this.prisma.entitlement.update({
          where: { id: entitlementId },
          data: { status: EntitlementStatus.REVOKED, revokedAt: new Date() },
        }),
      'Entitlement',
    )
  }

  async restore(entitlementId: string, options?: { requestingUserRole?: Role }) {
    if (!entitlementId) return AppError.notFound('Entitlement')
    const exists = await this.prisma.entitlement.findUnique({ where: { id: entitlementId } })
    if (!exists) return AppError.notFound('Entitlement')

    const canAdmin = hasRolePermission(options?.requestingUserRole, Role.ADMIN)
    if (!canAdmin) return AppError.forbidden('You do not have permission to restore entitlements')

    // Ensure there is no other ACTIVE entitlement with the same referenceId+source
    if (exists.referenceId) {
      const conflict = await this.prisma.entitlement.findFirst({
        where: {
          id: { not: entitlementId },
          source: exists.source,
          referenceId: exists.referenceId,
          status: EntitlementStatus.ACTIVE,
        },
        select: { id: true },
      })
      if (conflict) return AppError.conflict('Another active entitlement exists for this reference')
    }

    return this.handleDatabaseOperation(
      () =>
        this.prisma.entitlement.update({
          where: { id: entitlementId },
          data: { status: EntitlementStatus.ACTIVE, revokedAt: null },
        }),
      'Entitlement',
    )
  }
}
