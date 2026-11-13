import analytics from '@/lib/analytics'
import { getTrustLevel } from '@/lib/trust/config'
import { type TrustScoreRepository } from '@/server/repositories/trust-score.repository'
import { type TrustActionLog } from '@orm'

export type TrustScoreChange = Awaited<ReturnType<TrustScoreRepository['appendActions']>> &
  Pick<TrustActionLog, 'userId' | 'action'> & {
    entries?: Pick<TrustActionLog, 'action' | 'weight'>[]
  }

export function trackTrustScoreChange(change: TrustScoreChange | null): void {
  if (!change || change.delta === 0) return
  let oldScore = change.oldScore
  const entries = change.entries ?? [{ action: change.action, weight: change.delta }]
  for (const entry of entries) {
    const newScore = oldScore + entry.weight
    analytics.trust.trustScoreChanged({
      userId: change.userId,
      oldScore,
      newScore,
      action: entry.action,
      weight: entry.weight,
    })
    oldScore = newScore
  }
  const oldLevel = getTrustLevel(change.oldScore)
  const newLevel = getTrustLevel(change.newScore)
  if (oldLevel.name !== newLevel.name) {
    analytics.trust.trustLevelChanged({
      userId: change.userId,
      oldLevel: oldLevel.name,
      newLevel: newLevel.name,
      score: change.newScore,
      direction: change.newScore > change.oldScore ? 'up' : 'down',
    })
  }
}
