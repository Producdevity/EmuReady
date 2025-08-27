import { AppError, ResourceError, ValidationError } from '@/lib/errors'
import { Prisma, type PrismaClient } from '@orm'

/**
 * Base repository class with common properties and methods.
 *
 * IMPORTANT Repository Pattern Rules:
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

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Wrap async database operations with error handling.
   * Converts Prisma errors to AppErrors.
   * ALWAYS use this for database operations to ensure consistent error handling.
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
      throw AppError.databaseError(context)
    }
  }
}
