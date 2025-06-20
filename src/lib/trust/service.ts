import analytics from '@/lib/analytics'
import { prisma } from '@/server/db'
import { TrustAction } from '@orm'
import {
  TRUST_ACTIONS,
  TRUST_CONFIG,
  getTrustLevel,
  hasTrustLevel,
} from './config'

interface TrustActionContext {
  listingId?: string
  targetUserId?: string
  voteType?: 'up' | 'down'
  adminUserId?: string
  reason?: string
  voterId?: string
}

interface ApplyTrustActionParams {
  userId: string
  action: TrustAction
  context?: TrustActionContext
}

interface ReverseTrustActionParams {
  userId: string
  action: TrustAction
  context?: TrustActionContext
}

export async function applyTrustAction(
  params: ApplyTrustActionParams,
): Promise<void> {
  const { userId, action, context = {} } = params

  // Validate action exists
  if (!TRUST_ACTIONS[action]) {
    throw new Error(`Invalid trust action: ${action}`)
  }

  const weight = TRUST_ACTIONS[action].weight

  try {
    // Get user's current trust score before applying action
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { trustScore: true },
    })

    const currentTrustLevel = currentUser
      ? getTrustLevel(currentUser.trustScore)
      : null
    const newTrustScore = (currentUser?.trustScore || 0) + weight
    const newTrustLevel = getTrustLevel(newTrustScore)

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Update user's trust score
      await tx.user.update({
        where: { id: userId },
        data: {
          trustScore: {
            increment: weight,
          },
          lastActiveAt: new Date(),
        },
      })

      // Create audit log entry
      await tx.trustActionLog.create({
        data: {
          userId,
          action,
          weight,
          metadata: JSON.parse(JSON.stringify(context)),
        },
      })
    })

    analytics.trust.trustScoreChanged({
      userId,
      oldScore: currentUser?.trustScore || 0,
      newScore: newTrustScore,
      action,
      weight,
    })

    // Track trust level achievement if level changed
    if (currentTrustLevel && currentTrustLevel.name !== newTrustLevel.name) {
      analytics.trust.trustLevelChanged({
        userId,
        oldLevel: currentTrustLevel.name,
        newLevel: newTrustLevel.name,
        score: newTrustScore,
      })
    }
  } catch (error) {
    console.error('Failed to apply trust action:', error)
    throw new Error('Failed to update trust score')
  }
}

export async function reverseTrustAction(
  params: ReverseTrustActionParams,
): Promise<void> {
  const { userId, action, context = {} } = params

  // Validate action exists
  if (!TRUST_ACTIONS[action]) {
    throw new Error(`Invalid trust action: ${action}`)
  }

  // Apply the negative weight to reverse the action
  const weight = -TRUST_ACTIONS[action].weight

  try {
    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Update user's trust score
      await tx.user.update({
        where: { id: userId },
        data: {
          trustScore: {
            increment: weight,
          },
          lastActiveAt: new Date(),
        },
      })

      // Create audit log entry with negative weight
      await tx.trustActionLog.create({
        data: {
          userId,
          action,
          weight,
          metadata: JSON.parse(JSON.stringify(context)),
        },
      })
    })
  } catch (error) {
    console.error('Failed to reverse trust action:', error)
    throw new Error('Failed to update trust score')
  }
}

export async function validateTrustActionRate(
  userId: string,
  action: TrustAction,
): Promise<boolean> {
  // Check daily action limit
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayActionsCount = await prisma.trustActionLog.count({
    where: {
      userId,
      createdAt: {
        gte: today,
      },
    },
  })

  if (todayActionsCount >= TRUST_CONFIG.MAX_ACTIONS_PER_USER_PER_DAY) {
    return false
  }

  // Special rate limiting for voting actions
  if (action === TrustAction.UPVOTE || action === TrustAction.DOWNVOTE) {
    const rateLimitWindow = new Date(
      Date.now() - TRUST_CONFIG.VOTE_RATE_LIMIT.windowMs,
    )

    const recentVotes = await prisma.trustActionLog.count({
      where: {
        userId,
        action: {
          in: [TrustAction.UPVOTE, TrustAction.DOWNVOTE],
        },
        createdAt: {
          gte: rateLimitWindow,
        },
      },
    })

    if (recentVotes >= TRUST_CONFIG.VOTE_RATE_LIMIT.maxVotes) {
      return false
    }
  }

  return true
}

export async function getUserTrustLevel(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trustScore: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return getTrustLevel(user.trustScore)
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
  cutoffDate.setDate(
    cutoffDate.getDate() - TRUST_CONFIG.MIN_ACCOUNT_AGE_FOR_BONUS,
  )

  const activityCutoff = new Date()
  activityCutoff.setDate(
    activityCutoff.getDate() - TRUST_CONFIG.MAX_DAYS_INACTIVE_FOR_BONUS,
  )

  const eligibleUsers = await prisma.user.findMany({
    where: {
      createdAt: {
        lte: cutoffDate, // Account older than 30 days
      },
      lastActiveAt: {
        gte: activityCutoff, // Active within last 30 days
      },
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
          createdAt: {
            gte: thisMonth,
          },
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

export async function applyManualTrustAdjustment(params: {
  userId: string
  adjustment: number
  reason: string
  adminUserId: string
}): Promise<void> {
  const { userId, adjustment, reason, adminUserId } = params

  if (adjustment === 0) {
    throw new Error('Adjustment cannot be zero')
  }

  try {
    // Get user's current trust score before applying adjustment
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { trustScore: true, name: true, email: true },
    })

    if (!currentUser) {
      // TODO: use proper error later, now i just want to sleep
      throw new Error('User not found')
    }

    const currentTrustLevel = getTrustLevel(currentUser.trustScore)
    const newTrustScore = Math.max(0, currentUser.trustScore + adjustment) // Prevent negative trust scores
    const newTrustLevel = getTrustLevel(newTrustScore)
    const actualAdjustment = newTrustScore - currentUser.trustScore

    // Determine action type based on adjustment direction
    const action =
      adjustment > 0
        ? TrustAction.ADMIN_ADJUSTMENT_POSITIVE
        : TrustAction.ADMIN_ADJUSTMENT_NEGATIVE

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Update user's trust score
      await tx.user.update({
        where: { id: userId },
        data: {
          trustScore: newTrustScore,
          lastActiveAt: new Date(),
        },
      })

      // Create audit log entry with admin context
      await tx.trustActionLog.create({
        data: {
          userId,
          action,
          weight: actualAdjustment,
          metadata: {
            reason,
            adminUserId,
            adminName: await tx.user
              .findUnique({
                where: { id: adminUserId },
                select: { name: true, email: true },
              })
              .then((admin) => admin?.name || admin?.email || 'Unknown Admin'),
            originalAdjustment: adjustment,
            actualAdjustment,
          },
        },
      })
    })

    analytics.trust.trustScoreChanged({
      userId,
      oldScore: currentUser.trustScore,
      newScore: newTrustScore,
      action,
      weight: actualAdjustment,
    })

    // Track trust level achievement if level changed
    if (currentTrustLevel.name !== newTrustLevel.name) {
      analytics.trust.trustLevelChanged({
        userId,
        oldLevel: currentTrustLevel.name,
        newLevel: newTrustLevel.name,
        score: newTrustScore,
      })
    }
  } catch (error) {
    console.error('Failed to apply manual trust adjustment:', error)
    throw new Error('Failed to update trust score')
  }
}

export async function getTrustActionStats(userId?: string) {
  const whereClause = userId ? { userId } : {}

  const [totalActions, actionBreakdown, recentActions] = await Promise.all([
    prisma.trustActionLog.count({
      where: whereClause,
    }),
    prisma.trustActionLog.groupBy({
      by: ['action'],
      where: whereClause,
      _count: { action: true },
      _sum: { weight: true },
    }),
    prisma.trustActionLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ])

  return {
    totalActions,
    actionBreakdown,
    recentActions,
  }
}
