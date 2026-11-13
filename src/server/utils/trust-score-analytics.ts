import analytics from '@/lib/analytics'
import { getTrustLevel } from '@/lib/trust/config'
import { type TrustScoreRepository } from '@/server/repositories/trust-score.repository'
import { type TrustActionLog } from '@orm'

type TrustScoreChange = Awaited<ReturnType<TrustScoreRepository['appendActions']>> &
  Pick<TrustActionLog, 'userId' | 'action'>

export function trackTrustScoreChange(change: TrustScoreChange | null): void {
  if (!change) return
  analytics.trust.trustScoreChanged({
    userId: change.userId,
    oldScore: change.oldScore,
    newScore: change.newScore,
    action: change.action,
    weight: change.delta,
  })
  const oldLevel = getTrustLevel(change.oldScore)
  const newLevel = getTrustLevel(change.newScore)
  if (oldLevel.name !== newLevel.name) {
    analytics.trust.trustLevelChanged({
      userId: change.userId,
      oldLevel: oldLevel.name,
      newLevel: newLevel.name,
      score: change.newScore,
    })
  }
}
