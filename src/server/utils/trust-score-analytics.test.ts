import { beforeEach, expect, it, vi } from 'vitest'
import analytics from '@/lib/analytics'
import { TrustAction } from '@orm'
import { trackTrustScoreChange } from './trust-score-analytics'

vi.mock('@/lib/analytics', () => ({
  default: { trust: { trustScoreChanged: vi.fn(), trustLevelChanged: vi.fn() } },
}))

beforeEach(() => vi.clearAllMocks())

it('does not emit for a missing or zero net change', () => {
  trackTrustScoreChange(null)
  trackTrustScoreChange({
    userId: 'author-1',
    action: TrustAction.LISTING_APPROVED,
    oldScore: 100,
    newScore: 100,
    delta: 0,
  })
  expect(analytics.trust.trustScoreChanged).not.toHaveBeenCalled()
  expect(analytics.trust.trustLevelChanged).not.toHaveBeenCalled()
})

it('reports the compensation and approval reward with their own actions and weights', () => {
  const change = {
    userId: 'author-1',
    action: TrustAction.LISTING_APPROVED,
    oldScore: 92,
    newScore: 106,
    delta: 14,
    entries: [
      { action: TrustAction.ADMIN_ADJUSTMENT_POSITIVE, weight: 8 },
      { action: TrustAction.LISTING_APPROVED, weight: 6 },
    ],
  }
  trackTrustScoreChange(change)
  expect(analytics.trust.trustScoreChanged).toHaveBeenNthCalledWith(1, {
    userId: 'author-1',
    oldScore: 92,
    newScore: 100,
    action: TrustAction.ADMIN_ADJUSTMENT_POSITIVE,
    weight: 8,
  })
  expect(analytics.trust.trustScoreChanged).toHaveBeenNthCalledWith(2, {
    userId: 'author-1',
    oldScore: 100,
    newScore: 106,
    action: TrustAction.LISTING_APPROVED,
    weight: 6,
  })
})

it.each([
  { oldScore: 99, newScore: 105, oldLevel: 'Newcomer', newLevel: 'Contributor', direction: 'up' },
  { oldScore: 105, newScore: 99, oldLevel: 'Contributor', newLevel: 'Newcomer', direction: 'down' },
])('reports the direction of a committed level change ($direction)', (change) => {
  trackTrustScoreChange({
    userId: 'author-1',
    action: TrustAction.ADMIN_ADJUSTMENT_NEGATIVE,
    oldScore: change.oldScore,
    newScore: change.newScore,
    delta: change.newScore - change.oldScore,
  })
  expect(analytics.trust.trustLevelChanged).toHaveBeenCalledWith({
    userId: 'author-1',
    oldLevel: change.oldLevel,
    newLevel: change.newLevel,
    score: change.newScore,
    direction: change.direction,
  })
})
