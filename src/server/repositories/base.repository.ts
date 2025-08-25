import { AppError } from '@/lib/errors'
import { Prisma, type PrismaClient } from '@orm'

/**
 * Base repository class with common properties and methods
 */
export abstract class BaseRepository {
  protected readonly prisma: PrismaClient
  protected readonly mode: Prisma.QueryMode = Prisma.QueryMode.insensitive
  protected readonly sortOrder: Prisma.SortOrder = Prisma.SortOrder.asc

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Wrap async database operations with error handling
   * Converts Prisma errors to AppErrors
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
      // Re-throw if it's already an AppError
      if (error instanceof Error && error.name === 'TRPCError') {
        throw error
      }
      // Generic database error for unknown errors
      throw AppError.databaseError(context)
    }
  }
}
