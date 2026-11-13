import { AppError, ResourceError } from '@/lib/errors'
import { prisma } from '@/server/db'
import { TrustScoreRepository } from '@/server/repositories/trust-score.repository'
import { trackTrustScoreChange, type TrustScoreChange } from '@/server/utils/trust-score-analytics'
import { TrustAction } from '@orm'
import { type Prisma, type PrismaClient } from '@orm/client'
import { TRUST_ACTIONS, TRUST_CONFIG, hasTrustLevel } from './config'

interface TrustActionContext {
  listingId?: string
  pcListingId?: string
  targetUserId?: string
  voteType?: 'up' | 'down'
  adminUserId?: string
  reason?: string
  voterId?: string
  metadata?: Prisma.InputJsonObject
}

interface ApplyTrustActionParams {
  userId: string
  action: TrustAction
  context?: TrustActionContext
}

interface AutoApprovalPrismaClient {
  user: Pick<Prisma.TransactionClient['user'], 'findUnique'>
}

export async function applyTrustAction(params: ApplyTrustActionParams): Promise<void> {
  await new TrustService(prisma).logAction({
    userId: params.userId,
    action: params.action,
    metadata: params.context ? { ...params.context } : undefined,
  })
}

export async function canUserAutoApprove(
  userId: string,
  prismaClient: AutoApprovalPrismaClient = prisma,
): Promise<boolean> {
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { trustScore: true },
  })

  if (!user) return false

  return hasTrustLevel(user.trustScore, TRUST_CONFIG.AUTO_APPROVAL_MIN_LEVEL)
}

export async function getUsersEligibleForMonthlyBonus(): Promise<string[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - TRUST_CONFIG.MIN_ACCOUNT_AGE_FOR_BONUS)

  const activityCutoff = new Date()
  activityCutoff.setDate(activityCutoff.getDate() - TRUST_CONFIG.MAX_DAYS_INACTIVE_FOR_BONUS)

  const eligibleUsers = await prisma.user.findMany({
    where: {
      createdAt: { lte: cutoffDate }, // Account older than 30 days
      lastActiveAt: { gte: activityCutoff }, // Active within last 30 days
    },
    select: { id: true },
  })

  return eligibleUsers.map((user) => user.id)
}

export async function applyMonthlyActiveBonus(): Promise<{
  processedUsers: number
  errors: string[]
}> {
  const eligibleUserIds = await getUsersEligibleForMonthlyBonus()
  const errors: string[] = []
  let processedUsers = 0
  // TODO: this should only be applied to active users, we should check for recent activity (month timeframe), like votes, comments, listings, pc-listings, or last time signed in

  for (const userId of eligibleUserIds) {
    try {
      // Check if user already received bonus this month
      const thisMonth = new Date()
      thisMonth.setDate(1) // First day of current month
      thisMonth.setHours(0, 0, 0, 0)

      const existingBonus = await prisma.trustActionLog.findFirst({
        where: {
          userId,
          action: TrustAction.MONTHLY_ACTIVE_BONUS,
          createdAt: { gte: thisMonth },
        },
      })

      if (!existingBonus) {
        await applyTrustAction({
          userId,
          action: TrustAction.MONTHLY_ACTIVE_BONUS,
          context: { reason: 'Monthly active user bonus' },
        })
        processedUsers++
      }
    } catch (error) {
      errors.push(
        `Failed to process user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  return { processedUsers, errors }
}

export class TrustService {
  constructor(private readonly prisma: PrismaClient) {}

  static inTransaction(transaction: Prisma.TransactionClient, changes: TrustScoreChange[]) {
    return new TrustActionService(new TrustScoreRepository(transaction), changes)
  }

  private async run<T>(operation: (service: TrustActionService) => Promise<T>): Promise<T> {
    const committed = await this.prisma.$transaction(async (transaction) => {
      const changes: TrustScoreChange[] = []
      const result = await operation(TrustService.inTransaction(transaction, changes))
      return { result, changes }
    })
    for (const change of committed.changes) trackTrustScoreChange(change)
    return committed.result
  }

  logAction(params: Parameters<TrustActionService['logAction']>[0]) {
    return this.run((service) => service.logAction(params))
  }

  reverseLogAction(params: Parameters<TrustActionService['reverseLogAction']>[0]) {
    return this.run((service) => service.reverseLogAction(params))
  }

  applyManualAdjustment(params: Parameters<TrustActionService['applyManualAdjustment']>[0]) {
    return this.run((service) => service.applyManualAdjustment(params))
  }

  applyBulkManualAdjustments(
    params: Parameters<TrustActionService['applyBulkManualAdjustments']>[0],
  ) {
    return this.run((service) => service.applyBulkManualAdjustments(params))
  }
}

class TrustActionService {
  constructor(
    private readonly repository: TrustScoreRepository,
    private readonly changes: TrustScoreChange[],
  ) {}

  async logAction(params: {
    userId: string
    action: TrustAction
    targetUserId?: string
    metadata?: Prisma.InputJsonObject
  }): Promise<void> {
    if (!TRUST_ACTIONS[params.action])
      return AppError.badRequest(`Invalid trust action: ${params.action}`)
    this.changes.push(
      await this.repository.appendAction({
        userId: params.userId,
        action: params.action,
        weight: TRUST_ACTIONS[params.action].weight,
        metadata: params.metadata,
      }),
    )
  }

  async reverseLogAction(params: {
    userId: string
    originalAction: TrustAction
    targetUserId?: string
    metadata?: Prisma.InputJsonObject
  }): Promise<void> {
    if (!TRUST_ACTIONS[params.originalAction])
      return AppError.badRequest(`Invalid trust action: ${params.originalAction}`)
    const weight = -TRUST_ACTIONS[params.originalAction].weight
    if (weight === 0) return
    this.changes.push(
      await this.repository.appendAction({
        userId: params.userId,
        action: TrustAction.VOTE_CHANGE_REVERSAL,
        weight,
        metadata: { ...params.metadata, originalAction: params.originalAction, reversed: true },
      }),
    )
  }

  async applyManualAdjustment(params: {
    userId: string
    adjustment: number
    reason: string
    adminUserId: string
  }): Promise<void> {
    if (params.adjustment === 0) return ResourceError.trust.adjustmentCannotBeZero()
    if (!(await this.repository.findAdjustmentTarget(params.userId)))
      return ResourceError.user.notFound()
    const admin = await this.repository.findAdministrator(params.adminUserId)
    this.changes.push(
      await this.repository.appendAction({
        userId: params.userId,
        action:
          params.adjustment > 0
            ? TrustAction.ADMIN_ADJUSTMENT_POSITIVE
            : TrustAction.ADMIN_ADJUSTMENT_NEGATIVE,
        weight: params.adjustment,
        metadata: {
          reason: params.reason,
          adminUserId: params.adminUserId,
          adminName: admin?.name || admin?.email || 'Unknown Admin',
          adjustment: params.adjustment,
        },
      }),
    )
  }

  async applyBulkManualAdjustments(params: {
    adjustments: Map<string, number>
    reason: string
    adminUserId: string
  }): Promise<number> {
    const entries = [...params.adjustments].filter(([, adjustment]) => adjustment !== 0)
    if (entries.length === 0) return 0
    const users = await this.repository.findAdjustmentTargets(entries.map(([id]) => id))
    const found = new Set(users.map((user) => user.id))
    const selected = entries.filter(([id]) => found.has(id))
    if (selected.length === 0) return 0
    const admin = await this.repository.findAdministrator(params.adminUserId)
    const changes = await this.repository.appendBulkActions(
      selected.map(([userId, adjustment]) => ({
        userId,
        action:
          adjustment > 0
            ? TrustAction.ADMIN_ADJUSTMENT_POSITIVE
            : TrustAction.ADMIN_ADJUSTMENT_NEGATIVE,
        weight: adjustment,
        metadata: {
          reason: params.reason,
          adminUserId: params.adminUserId,
          adminName: admin?.name || admin?.email || 'Unknown Admin',
          adjustment,
        },
      })),
    )
    this.changes.push(...changes)
    return changes.length
  }
}
