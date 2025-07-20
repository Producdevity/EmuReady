import { ZodError } from 'zod'
import { Prisma } from '@orm'

export class RestApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'RestApiError'
  }
}

/**
 * Convert various error types to RestApiError
 */
export function normalizeError(error: unknown): RestApiError {
  // Already a RestApiError
  if (error instanceof RestApiError) {
    return error
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return new RestApiError(
      400,
      'VALIDATION_ERROR',
      'Invalid request parameters',
      error.flatten(),
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new RestApiError(409, 'CONFLICT', 'Resource already exists', {
          field: error.meta?.target,
        })
      case 'P2025':
        return new RestApiError(404, 'NOT_FOUND', 'Resource not found')
      default:
        return new RestApiError(
          400,
          'DATABASE_ERROR',
          'Database operation failed',
          { code: error.code },
        )
    }
  }

  // TRPC-like errors (for service layer compatibility)
  if (error && typeof error === 'object' && 'code' in error) {
    const trpcError = error as { code: string; message?: string }
    switch (trpcError.code) {
      case 'NOT_FOUND':
        return new RestApiError(
          404,
          'NOT_FOUND',
          trpcError.message || 'Resource not found',
        )
      case 'UNAUTHORIZED':
        return new RestApiError(
          401,
          'UNAUTHORIZED',
          trpcError.message || 'Authentication required',
        )
      case 'FORBIDDEN':
        return new RestApiError(
          403,
          'FORBIDDEN',
          trpcError.message || 'Access denied',
        )
      case 'CONFLICT':
        return new RestApiError(
          409,
          'CONFLICT',
          trpcError.message || 'Resource conflict',
        )
      case 'BAD_REQUEST':
        return new RestApiError(
          400,
          'BAD_REQUEST',
          trpcError.message || 'Invalid request',
        )
      default:
        return new RestApiError(
          500,
          'INTERNAL_ERROR',
          trpcError.message || 'An error occurred',
        )
    }
  }

  // Generic error
  if (error instanceof Error) {
    return new RestApiError(500, 'INTERNAL_ERROR', error.message)
  }

  // Unknown error
  return new RestApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
}

/**
 * Common error factories
 */
export const ApiErrors = {
  notFound: (resource = 'Resource') =>
    new RestApiError(404, 'NOT_FOUND', `${resource} not found`),

  unauthorized: (message = 'Authentication required') =>
    new RestApiError(401, 'UNAUTHORIZED', message),

  forbidden: (message = 'Access denied') =>
    new RestApiError(403, 'FORBIDDEN', message),

  badRequest: (message = 'Invalid request') =>
    new RestApiError(400, 'BAD_REQUEST', message),

  conflict: (message = 'Resource conflict') =>
    new RestApiError(409, 'CONFLICT', message),

  validation: (details: unknown) =>
    new RestApiError(400, 'VALIDATION_ERROR', 'Validation failed', details),

  internal: (message = 'Internal server error') =>
    new RestApiError(500, 'INTERNAL_ERROR', message),
}
