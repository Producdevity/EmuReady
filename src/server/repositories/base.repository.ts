import { BATCH_SIZES } from '@/data/constants'
import { AppError, ResourceError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { hasRolePermission } from '@/utils/permissions'
import { Prisma, Role, type PrismaClient } from '@orm'
import type { VisibilityContext } from './types'

/**
 * Base repository class with common properties and methods.
 *
 * Repository Pattern Rules:
 * 1. Repositories ALWAYS THROW errors (never return them)
 * 2. Use static readonly includes with satisfies for query shapes
 * 3. Method naming conventions:
 *    - byId(id) - get single item by ID
 *    - list(filters) - get paginated list
 *    - create(data) - create new item
 *    - update(id, data) - update existing item
 *    - delete(id) - delete item
 *    - stats() - get statistics
 *    - Additional methods should follow pattern: byX, listX, etc.
 * 4. NO type namespaces - define types inline or export separately
 * 5. Use handleDatabaseOperation for all database calls to ensure proper error handling
 */
export abstract class BaseRepository {
  protected readonly prisma: PrismaClient
  protected readonly mode: Prisma.QueryMode = Prisma.QueryMode.insensitive
  protected readonly sortOrder: Prisma.SortOrder = Prisma.SortOrder.asc

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma as PrismaClient
  }

  /**
   * Cursor-based batch iteration for large result sets.
   * Yields batches of records using Prisma cursor pagination,
   * ensuring constant memory usage regardless of total result count.
   */
  protected async *cursorBatchIterator<T extends { id: string }>(
    queryFn: (params: { cursor?: { id: string }; take: number; skip?: number }) => Promise<T[]>,
    batchSize: number = BATCH_SIZES.CURSOR_DEFAULT,
  ): AsyncGenerator<T[], void, undefined> {
    let cursor: string | undefined
    while (true) {
      const batch = await queryFn({
        take: batchSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      })
      if (batch.length === 0) break
      cursor = batch[batch.length - 1].id
      yield batch
      if (batch.length < batchSize) break
    }
  }

  /**
   * Wrap async database operations with error handling.
   * Converts Prisma errors to AppErrors.
   * Always use this for database operations to ensure consistent error handling.
   */
  protected async handleDatabaseOperation<T>(
    operation: () => Promise<T>,
    context?: string,
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw AppError.alreadyExists(context)
          case 'P2025': // Record not found
            throw AppError.notFound(context)
          case 'P2003': // Foreign key constraint violation
            throw AppError.resourceInUse(context || 'Resource')
          default:
            throw AppError.databaseError(context)
        }
      }
      // Re-throw if it's already an AppError or ResourceError
      if (
        error instanceof AppError ||
        error instanceof ResourceError ||
        error instanceof ValidationError
      ) {
        throw error
      }
      // Re-throw if it's already a TRPCError
      if (error instanceof Error && error.name === 'TRPCError') {
        throw error
      }
      // Generic database error for unknown errors
      logger.error('[BaseRepository] Database error', error, { context })
      throw AppError.databaseError(context)
    }
  }

  /**
   * Checks whether a list/count should be hidden based on user visibility settings.
   * Returns true if the data should be hidden (not visible).
   * Short-circuits for owner and moderator+ roles without querying the DB.
   */
  protected async checkSettingVisibility(
    userId: string,
    ctx: VisibilityContext | undefined,
    fetchSetting: () => Promise<boolean | null | undefined>,
    defaultVisible: boolean = true,
  ): Promise<boolean> {
    if (ctx?.requestingUserId === userId) return false
    if (hasRolePermission(ctx?.requestingUserRole, Role.MODERATOR)) return false

    const isVisible = await fetchSetting()
    return !(isVisible ?? defaultVisible)
  }
}
