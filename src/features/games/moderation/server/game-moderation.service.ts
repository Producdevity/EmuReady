import { AppError, ResourceError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { TrustService } from '@/lib/trust/service'
import { type ApproveGameInput } from '@/schemas/game'
import { requireActorPermission, type Actor } from '@/server/auth/actor'
import {
  invalidateGameRelatedContent,
  invalidateSitemap,
  revalidateByTag,
} from '@/server/cache/invalidation'
import { gameStatsCache } from '@/server/utils/cache'
import { validateNonEmptyArray } from '@/server/utils/security-validation'
import { trackTrustScoreChange, type TrustScoreChange } from '@/server/utils/trust-score-analytics'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, TrustAction } from '@orm'
import { type GameModerationRepository } from './game-moderation.repository'
import { type GameModerationRecord } from './persistence/game-moderation.prisma'
import { type GameModerationStatus } from '../shared/game-moderation.schemas'

export const GAME_STATS_CACHE_KEY = 'game-stats'

export class GameModerationService {
  constructor(private readonly repository: GameModerationRepository) {}

  async review(actor: Actor, input: ApproveGameInput) {
    const user = requireActorPermission(actor, PERMISSIONS.APPROVE_GAMES)
    const committed = await this.repository.transaction(async (repository, transaction) => {
      const trustChanges: TrustScoreChange[] = []
      const game = await repository.find(input.id)
      if (!game) return ResourceError.game.notFound()
      if (game.status !== ApprovalStatus.PENDING) return ResourceError.game.alreadyProcessed()
      const result = await repository.setStatus(input.id, input.status, user.userId)
      await applyDecisionTrust(
        TrustService.inTransaction(transaction, trustChanges),
        result,
        input.status,
        user.userId,
        false,
      )
      return { result, trustChanges }
    })
    this.complete(committed.trustChanges)
    await invalidateGameRelatedContent(input.id)
    if (input.status === ApprovalStatus.APPROVED) {
      await invalidateSitemap()
      await revalidateByTag('games')
      await revalidateByTag(`game-${input.id}`)
      await revalidateByTag(`system-${committed.result.systemId}`)
    }
    return { status: committed.result.status }
  }

  async approveMany(actor: Actor, gameIds: string[]) {
    const approved = await this.reviewPending(actor, gameIds, ApprovalStatus.APPROVED)
    Promise.all([
      ...approved.map((game) => invalidateGameRelatedContent(game.id)),
      ...approved.map((game) => revalidateByTag(`game-${game.id}`)),
      invalidateSitemap(),
      revalidateByTag('games'),
    ]).catch((error: unknown) => {
      logger.error('[GameModerationService] Cache invalidation failed:', error)
    })
    return approved.length
  }

  async rejectMany(actor: Actor, gameIds: string[]) {
    return (await this.reviewPending(actor, gameIds, ApprovalStatus.REJECTED)).length
  }

  private async reviewPending(actor: Actor, gameIds: string[], status: GameModerationStatus) {
    const user = requireActorPermission(actor, PERMISSIONS.APPROVE_GAMES)
    validateNonEmptyArray(gameIds, 'gameIds')
    const committed = await this.repository.transaction(async (repository, transaction) => {
      const trustChanges: TrustScoreChange[] = []
      const games = await repository.pending(gameIds)
      if (games.length === 0)
        return AppError.badRequest(
          `No valid pending games found to ${status === ApprovalStatus.APPROVED ? 'approve' : 'reject'}`,
        )
      await repository.setPendingStatuses(
        games.map((game) => game.id),
        status,
        user.userId,
      )
      const trust = TrustService.inTransaction(transaction, trustChanges)
      for (const game of games) await applyDecisionTrust(trust, game, status, user.userId, true)
      return { games, trustChanges }
    })
    this.complete(committed.trustChanges)
    return committed.games
  }

  private complete(trustChanges: TrustScoreChange[]) {
    for (const change of trustChanges) trackTrustScoreChange(change)
    gameStatsCache.delete(GAME_STATS_CACHE_KEY)
  }
}

async function applyDecisionTrust(
  trust: ReturnType<typeof TrustService.inTransaction>,
  game: GameModerationRecord,
  status: GameModerationStatus,
  actorId: string,
  bulk: boolean,
) {
  if (!game.submittedBy) return
  const approved = status === ApprovalStatus.APPROVED
  await trust.logAction({
    userId: game.submittedBy,
    action: approved ? TrustAction.GAME_SUBMISSION_APPROVED : TrustAction.GAME_SUBMISSION_REJECTED,
    metadata: {
      gameId: game.id,
      gameTitle: game.title,
      systemId: game.systemId,
      ...(approved ? { approvedBy: actorId } : { rejectedBy: actorId }),
      ...(bulk ? { bulkOperation: true } : {}),
    },
  })
}
