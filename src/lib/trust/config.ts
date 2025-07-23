import { ms } from '@/utils/time'
import { TrustAction } from '@orm'

export const TRUST_ACTIONS = {
  [TrustAction.UPVOTE]: { weight: 1, description: 'Upvoted a listing' },
  [TrustAction.DOWNVOTE]: { weight: -1, description: 'Downvoted a listing' },
  [TrustAction.LISTING_CREATED]: {
    weight: 1,
    description: 'Created a listing',
  },
  [TrustAction.LISTING_APPROVED]: {
    weight: 4,
    description: 'Listing was approved',
  },
  [TrustAction.LISTING_REJECTED]: {
    weight: -8,
    description: 'Listing was rejected',
  },
  [TrustAction.MONTHLY_ACTIVE_BONUS]: {
    weight: 10,
    description: 'Monthly active user bonus',
  },
  [TrustAction.LISTING_RECEIVED_UPVOTE]: {
    weight: 2,
    description: 'Received an upvote on a listing',
  },
  [TrustAction.LISTING_RECEIVED_DOWNVOTE]: {
    weight: -1,
    description: 'Received a downvote on a listing',
  },
  [TrustAction.ADMIN_ADJUSTMENT_POSITIVE]: {
    weight: 0, // Dynamic weight set by admin
    description: 'Manual trust score increase by admin',
  },
  [TrustAction.ADMIN_ADJUSTMENT_NEGATIVE]: {
    weight: 0, // Dynamic weight set by admin
    description: 'Manual trust score decrease by admin',
  },
} as const

export const TRUST_LEVELS = [
  { name: 'New', minScore: 0 },
  { name: 'Contributor', minScore: 100 },
  { name: 'Trusted', minScore: 250 },
  { name: 'Verified', minScore: 500 },
  { name: 'Elite', minScore: 1000 },
  { name: 'Core', minScore: 1500 },
] as const

export type TrustLevel = (typeof TRUST_LEVELS)[number]

export const TRUST_CONFIG = {
  // Minimum account age (in days) to be eligible for monthly active bonus
  MIN_ACCOUNT_AGE_FOR_BONUS: 30,

  // Maximum days since last activity to be considered active
  MAX_DAYS_INACTIVE_FOR_BONUS: 30,

  // Minimum trust level required for auto-approval
  AUTO_APPROVAL_MIN_LEVEL: 'Trusted',

  // Maximum trust actions per user per day to prevent abuse
  MAX_ACTIONS_PER_USER_PER_DAY: 50,

  // Rate limiting for voting actions
  VOTE_RATE_LIMIT: {
    windowMs: ms.minutes(1),
    maxVotes: 10,
  },
} as const

export function getTrustLevel(score: number): TrustLevel {
  // Find the highest level the user qualifies for
  for (let i = TRUST_LEVELS.length - 1; i >= 0; i--) {
    if (score >= TRUST_LEVELS[i].minScore) {
      return TRUST_LEVELS[i]
    }
  }
  return TRUST_LEVELS[0] // Default to 'New' level
}

export function getNextTrustLevel(currentScore: number): TrustLevel | null {
  const currentLevel = getTrustLevel(currentScore)
  const currentIndex = TRUST_LEVELS.findIndex(
    (level) => level.name === currentLevel.name,
  )

  if (currentIndex < TRUST_LEVELS.length - 1) {
    return TRUST_LEVELS[currentIndex + 1]
  }

  return null // Already at max level
}

export function getProgressToNextLevel(currentScore: number): number {
  const nextLevel = getNextTrustLevel(currentScore)
  if (!nextLevel) return 1 // Already at max level

  const currentLevel = getTrustLevel(currentScore)
  const progressRange = nextLevel.minScore - currentLevel.minScore
  const currentProgress = currentScore - currentLevel.minScore

  return Math.min(currentProgress / progressRange, 1)
}

export function hasTrustLevel(score: number, requiredLevel: string): boolean {
  const userLevel = getTrustLevel(score)
  const requiredLevelIndex = TRUST_LEVELS.findIndex(
    (level) => level.name === requiredLevel,
  )
  const userLevelIndex = TRUST_LEVELS.findIndex(
    (level) => level.name === userLevel.name,
  )

  return userLevelIndex >= requiredLevelIndex
}
