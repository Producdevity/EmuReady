import { ResourceError } from '@/lib/errors'
import { ApprovalStatus, type Game } from '@orm'

export function assertCanEditOwnPendingGame(
  game: Pick<Game, 'submittedBy' | 'status'>,
  userId: string,
): void {
  if (game.submittedBy !== userId) return ResourceError.game.canOnlyEditOwn()
  if (game.status !== ApprovalStatus.PENDING) return ResourceError.game.canOnlyEditPending()
}
