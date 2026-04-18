import { z } from 'zod'
import analytics from '@/lib/analytics'
import { ResourceError } from '@/lib/errors'
import { prisma } from '@/server/db'
import { validateData } from '@/server/utils/validation'
import { TrustAction, type Prisma, type PrismaClient } from '@orm'
import { TRUST_ACTIONS, TRUST_CONFIG, getTrustLevel, hasTrustLevel } from './config'

const UNKNOWN_TRUST_LEVEL_NAME = 'Unranked'

function resolveTrustLevelName(level: ReturnType<typeof getTrustLevel> | null): string {
  return level?.name ?? UNKNOWN_TRUST_LEVEL_NAME
}

interface TrustActionContext {
  listingId?: string
  pcListingId?: string
  targetUserId?: string
  voteType?: 'up' | 'down'
  adminUserId?: string
  reason?: string
  voterId?: string
  metadata?: Record<string, unknown>
}

interface ApplyTrustActionParams {
  userId: string
  action: TrustAction
  context?: TrustActionContext
}

export async function applyTrustAction(params: ApplyTrustActionParams): Promise<void> {
  const { userId, action, context = {} } = params

  if (!TRUST_ACTIONS[action]) {
    throw new Error(`Invalid trust action: ${action}`)
  }

  const weight = TRUST_ACTIONS[action].weight

  await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { trustScore: true },
    })

    const currentTrustLevel = currentUser ? getTrustLevel(currentUser.trustScore) : null
    const newTrustScore = (currentUser?.trustScore || 0) + weight
    const newTrustLevel = getTrustLevel(newTrustScore)

    await tx.user.update({
      where: { id: userId },
      data: {
        trustScore: { increment: weight },
        lastActiveAt: new Date(),
      },
    })

    await tx.trustActionLog.create({
      data: {
        userId,
        action,
        weight,
        metadata: validateData(z.record(z.unknown()), context || {}) as Prisma.InputJsonValue,
      },
    })

    analytics.trust.trustScoreChanged({
      userId,
      oldScore: currentUser?.trustScore || 0,
      newScore: newTrustScore,
      action,
      weight,
    })

    const previousLevel = currentTrustLevel?.name ?? null
    const nextLevel = newTrustLevel.name ?? null

    if (previousLevel !== nextLevel) {
      analytics.trust.trustLevelChanged({
        userId,
        oldLevel: resolveTrustLevelName(currentTrustLevel),
        newLevel: resolveTrustLevelName(newTrustLevel),
        score: newTrustScore,
      })
    }
  })
}

/**
 * Reverses the trust impact of a previously applied trust action.
 * Applies the negative of the original action's weight.
 */
export async function reverseTrustAction(params: {
  userId: string
  originalAction: TrustAction
  context?: TrustActionContext
}): Promise<void> {
  const { userId, originalAction, context = {} } = params

  if (!TRUST_ACTIONS[originalAction]) {
    throw new Error(`Invalid trust action: ${originalAction}`)
  }

  const originalWeight = TRUST_ACTIONS[originalAction].weight
  if (originalWeight === 0) return

  const reversalWeight = -originalWeight

  await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { trustScore: true },
    })

    const currentTrustLevel = currentUser ? getTrustLevel(currentUser.trustScore) : null
    const newTrustScore = (currentUser?.trustScore ?? 0) + reversalWeight
    const newTrustLevel = getTrustLevel(newTrustScore)

    await tx.user.update({
      where: { id: userId },
      data: {
        trustScore: newTrustScore,
        lastActiveAt: new Date(),
      },
    })

    await tx.trustActionLog.create({
      data: {
        userId,
        action: TrustAction.VOTE_NULLIFICATION_REVERSAL,
        weight: reversalWeight,
        metadata: validateData(z.record(z.unknown()), {
          ...context,
          originalAction,
          reversed: true,
        }) as Prisma.InputJsonValue,
      },
    })

    analytics.trust.trustScoreChanged({
      userId,
      oldScore: currentUser?.trustScore || 0,
      newScore: newTrustScore,
      action: TrustAction.VOTE_NULLIFICATION_REVERSAL,
      weight: reversalWeight,
    })

    const previousLevel = currentTrustLevel?.name ?? null
    const nextLevel = newTrustLevel.name ?? null

    if (previousLevel !== nextLevel) {
      analytics.trust.trustLevelChanged({
        userId,
        oldLevel: resolveTrustLevelName(currentTrustLevel),
        newLevel: resolveTrustLevelName(newTrustLevel),
        score: newTrustScore,
      })
    }
  })
}

export async function canUserAutoApprove(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
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

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * TrustService class for managing trust actions.
 * Accepts either a PrismaClient (creates its own transactions) or a
 * TransactionClient (participates in an outer transaction).
 */
export class TrustService {
  constructor(private readonly prisma: PrismaClient | PrismaTransaction) {}

  async logAction(params: {
    userId: string
    action: TrustAction
    targetUserId?: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const { userId, action, metadata } = params

    if (!TRUST_ACTIONS[action]) {
      throw new Error(`Invalid trust action: ${action}`)
    }

    const weight = TRUST_ACTIONS[action].weight

    const executeInTransaction = async (prismaCtx: PrismaTransaction) => {
      const currentUser = await prismaCtx.user.findUnique({
        where: { id: userId },
        select: { trustScore: true },
      })

      const currentTrustLevel = currentUser ? getTrustLevel(currentUser.trustScore) : null
      const newTrustScore = (currentUser?.trustScore || 0) + weight
      const newTrustLevel = getTrustLevel(newTrustScore)

      await prismaCtx.user.update({
        where: { id: userId },
        data: {
          trustScore: newTrustScore,
          lastActiveAt: new Date(),
        },
      })

      await prismaCtx.trustActionLog.create({
        data: {
          userId,
          action,
          weight,
          metadata: metadata as Prisma.InputJsonValue,
        },
      })

      analytics.trust.trustScoreChanged({
        userId,
        oldScore: currentUser?.trustScore || 0,
        newScore: newTrustScore,
        action,
        weight,
      })

      const previousLevel = currentTrustLevel?.name ?? null
      const nextLevel = newTrustLevel.name ?? null

      if (previousLevel !== nextLevel) {
        analytics.trust.trustLevelChanged({
          userId,
          oldLevel: resolveTrustLevelName(currentTrustLevel),
          newLevel: resolveTrustLevelName(newTrustLevel),
          score: newTrustScore,
        })
      }
    }

    if ('$transaction' in this.prisma) {
      await this.prisma.$transaction(executeInTransaction)
    } else {
      await executeInTransaction(this.prisma)
    }
  }

  async reverseLogAction(params: {
    userId: string
    originalAction: TrustAction
    targetUserId?: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const { userId, originalAction, metadata = {} } = params

    if (!TRUST_ACTIONS[originalAction]) {
      throw new Error(`Invalid trust action: ${originalAction}`)
    }

    const reversalWeight = -TRUST_ACTIONS[originalAction].weight
    if (reversalWeight === 0) return

    const executeInTransaction = async (prismaCtx: PrismaTransaction) => {
      const currentUser = await prismaCtx.user.findUnique({
        where: { id: userId },
        select: { trustScore: true },
      })

      const currentTrustLevel = currentUser ? getTrustLevel(currentUser.trustScore) : null
      const newTrustScore = (currentUser?.trustScore ?? 0) + reversalWeight
      const newTrustLevel = getTrustLevel(newTrustScore)

      await prismaCtx.user.update({
        where: { id: userId },
        data: {
          trustScore: newTrustScore,
          lastActiveAt: new Date(),
        },
      })

      await prismaCtx.trustActionLog.create({
        data: {
          userId,
          action: TrustAction.VOTE_CHANGE_REVERSAL,
          weight: reversalWeight,
          metadata: { ...metadata, originalAction, reversed: true } as Prisma.InputJsonValue,
        },
      })

      analytics.trust.trustScoreChanged({
        userId,
        oldScore: currentUser?.trustScore ?? 0,
        newScore: newTrustScore,
        action: TrustAction.VOTE_CHANGE_REVERSAL,
        weight: reversalWeight,
      })

      const previousLevel = currentTrustLevel?.name ?? null
      const nextLevel = newTrustLevel.name ?? null

      if (previousLevel !== nextLevel) {
        analytics.trust.trustLevelChanged({
          userId,
          oldLevel: resolveTrustLevelName(currentTrustLevel),
          newLevel: resolveTrustLevelName(newTrustLevel),
          score: newTrustScore,
        })
      }
    }

    if ('$transaction' in this.prisma) {
      await this.prisma.$transaction(executeInTransaction)
    } else {
      await executeInTransaction(this.prisma)
    }
  }

  async applyManualAdjustment(params: {
    userId: string
    adjustment: number
    reason: string
    adminUserId: string
  }): Promise<void> {
    const { userId, adjustment, reason, adminUserId } = params

    if (adjustment === 0) {
      throw ResourceError.trust.adjustmentCannotBeZero()
    }

    const executeAdjustment = async (prismaCtx: PrismaTransaction) => {
      const currentUser = await prismaCtx.user.findUnique({
        where: { id: userId },
        select: { trustScore: true, name: true, email: true },
      })

      if (!currentUser) {
        throw ResourceError.user.notFound()
      }

      const currentTrustLevel = getTrustLevel(currentUser.trustScore)
      const newTrustScore = currentUser.trustScore + adjustment
      const newTrustLevel = getTrustLevel(newTrustScore)

      const action =
        adjustment > 0
          ? TrustAction.ADMIN_ADJUSTMENT_POSITIVE
          : TrustAction.ADMIN_ADJUSTMENT_NEGATIVE

      await prismaCtx.user.update({
        where: { id: userId },
        data: {
          trustScore: newTrustScore,
          lastActiveAt: new Date(),
        },
      })

      const admin = await prismaCtx.user.findUnique({
        where: { id: adminUserId },
        select: { name: true, email: true },
      })

      await prismaCtx.trustActionLog.create({
        data: {
          userId,
          action,
          weight: adjustment,
          metadata: {
            reason,
            adminUserId,
            adminName: admin?.name || admin?.email || 'Unknown Admin',
            adjustment,
          },
        },
      })

      analytics.trust.trustScoreChanged({
        userId,
        oldScore: currentUser.trustScore,
        newScore: newTrustScore,
        action,
        weight: adjustment,
      })

      if ((currentTrustLevel.name ?? null) !== (newTrustLevel.name ?? null)) {
        analytics.trust.trustLevelChanged({
          userId,
          oldLevel: resolveTrustLevelName(currentTrustLevel),
          newLevel: resolveTrustLevelName(newTrustLevel),
          score: newTrustScore,
        })
      }
    }

    if ('$transaction' in this.prisma) {
      await this.prisma.$transaction(executeAdjustment)
    } else {
      await executeAdjustment(this.prisma)
    }
  }

  async applyBulkManualAdjustments(params: {
    adjustments: Map<string, number>
    reason: string
    adminUserId: string
  }): Promise<number> {
    const { adjustments, reason, adminUserId } = params

    const nonZeroEntries = [...adjustments.entries()].filter(([, adj]) => adj !== 0)
    if (nonZeroEntries.length === 0) return 0

    const userIds = nonZeroEntries.map(([id]) => id)

    const executeBulk = async (prismaCtx: PrismaTransaction) => {
      const users = await prismaCtx.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, trustScore: true },
      })

      const userMap = new Map(users.map((u) => [u.id, u.trustScore]))
      const foundEntries = nonZeroEntries.filter(([id]) => userMap.has(id))
      if (foundEntries.length === 0) return 0

      const admin = await prismaCtx.user.findUnique({
        where: { id: adminUserId },
        select: { name: true, email: true },
      })
      const adminName = admin?.name || admin?.email || 'Unknown Admin'

      const logEntries: {
        userId: string
        action: TrustAction
        weight: number
        metadata: Prisma.InputJsonValue
      }[] = []

      const levelChanges: {
        userId: string
        oldLevel: string
        newLevel: string
        score: number
      }[] = []

      for (const [userId, adjustment] of foundEntries) {
        const currentScore = userMap.get(userId) ?? 0
        const newTrustScore = currentScore + adjustment

        const action =
          adjustment > 0
            ? TrustAction.ADMIN_ADJUSTMENT_POSITIVE
            : TrustAction.ADMIN_ADJUSTMENT_NEGATIVE

        await prismaCtx.user.update({
          where: { id: userId },
          data: {
            trustScore: newTrustScore,
            lastActiveAt: new Date(),
          },
        })

        logEntries.push({
          userId,
          action,
          weight: adjustment,
          metadata: {
            reason,
            adminUserId,
            adminName,
            adjustment,
          },
        })

        analytics.trust.trustScoreChanged({
          userId,
          oldScore: currentScore,
          newScore: newTrustScore,
          action,
          weight: adjustment,
        })

        const currentTrustLevel = getTrustLevel(currentScore)
        const newTrustLevel = getTrustLevel(newTrustScore)
        if ((currentTrustLevel.name ?? null) !== (newTrustLevel.name ?? null)) {
          levelChanges.push({
            userId,
            oldLevel: resolveTrustLevelName(currentTrustLevel),
            newLevel: resolveTrustLevelName(newTrustLevel),
            score: newTrustScore,
          })
        }
      }

      await prismaCtx.trustActionLog.createMany({ data: logEntries })

      for (const change of levelChanges) {
        analytics.trust.trustLevelChanged(change)
      }

      return foundEntries.length
    }

    if ('$transaction' in this.prisma) {
      return this.prisma.$transaction(executeBulk)
    }
    return executeBulk(this.prisma)
  }
}
