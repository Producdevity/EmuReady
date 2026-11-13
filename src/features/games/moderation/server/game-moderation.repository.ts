import { TRPCError } from '@trpc/server'
import { AppError, ResourceError } from '@/lib/errors'
import { PrismaWriteRepository } from '@/server/persistence/prisma.repository'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { withRetryTransaction } from '@/server/utils/transactions'
import { ApprovalStatus, Prisma } from '@orm'
import { type PrismaClient } from '@orm/client'
import { GAME_MODERATION_SELECT } from './persistence/game-moderation.prisma'
import { type GameModerationStatus } from '../shared/game-moderation.schemas'

type WriteContext = 'review' | 'bulk review'

export class GameModerationRepository extends PrismaWriteRepository<WriteContext> {
  constructor(
    private readonly owner: PrismaClient,
    private readonly transactionClient: Prisma.TransactionClient | null = null,
  ) {
    super(transactionClient ?? owner)
  }

  transaction<T>(
    operation: (
      repository: GameModerationRepository,
      transaction: Prisma.TransactionClient,
    ) => Promise<T>,
  ) {
    if (this.transactionClient !== null)
      return AppError.internalError('Game moderation requires a transaction owner')
    return withRetryTransaction(
      this.owner,
      (transaction) =>
        operation(new GameModerationRepository(this.owner, transaction), transaction),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  find(id: string) {
    return this.prisma.game.findUnique({ where: { id }, select: GAME_MODERATION_SELECT })
  }

  pending(ids: string[]) {
    return this.prisma.game.findMany({
      where: { id: { in: ids }, status: ApprovalStatus.PENDING },
      select: GAME_MODERATION_SELECT,
      orderBy: { id: Prisma.SortOrder.asc },
    })
  }

  setStatus(id: string, status: GameModerationStatus, actorId: string) {
    return this.executeWrite(
      () =>
        this.prisma.game.update({
          where: { id },
          data: { status, approvedBy: actorId, approvedAt: new Date() },
          select: GAME_MODERATION_SELECT,
        }),
      'review',
    )
  }

  setPendingStatuses(ids: string[], status: GameModerationStatus, actorId: string) {
    return this.executeWrite(
      () =>
        this.prisma.game.updateMany({
          where: { id: { in: ids }, status: ApprovalStatus.PENDING },
          data: {
            status,
            approvedBy: actorId,
            approvedAt: new Date(),
            // TODO: Add rejectionNotes
            // Note: There's no rejectionNotes field in the schema, we should add it
          },
        }),
      'bulk review',
    )
  }

  protected translateWriteError(error: unknown, context: WriteContext): never {
    if (error instanceof TRPCError) throw error
    if (isPrismaError(error, PRISMA_ERROR_CODES.TRANSACTION_FAILED)) throw error
    if (isPrismaError(error, PRISMA_ERROR_CODES.RECORD_NOT_FOUND))
      return ResourceError.game.notFound()
    return AppError.databaseError(`game ${context}`, error instanceof Error ? error : undefined)
  }
}
