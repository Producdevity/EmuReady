/**
 * Prisma error codes as constants to avoid magic strings
 * See: https://www.prisma.io/docs/reference/api-reference/error-reference
 */

export const PRISMA_ERROR_CODES = {
  // Constraint violations
  UNIQUE_CONSTRAINT_VIOLATION: 'P2002',
  FOREIGN_KEY_CONSTRAINT_VIOLATION: 'P2003',

  // Record operations
  RECORD_NOT_FOUND: 'P2025',

  // Transaction errors
  TRANSACTION_FAILED: 'P2034',
  RAW_QUERY_FAILED: 'P2010',

  // Connection errors
  CONNECTION_ERROR: 'P1000',
  CONNECTION_TIMEOUT: 'P1008',

  // Schema errors
  FIELD_NOT_FOUND: 'P2009',
  MISSING_REQUIRED_VALUE: 'P2012',
  INVALID_VALUE: 'P2007',
} as const

export type PrismaErrorCode = (typeof PRISMA_ERROR_CODES)[keyof typeof PRISMA_ERROR_CODES]

/**
 * Helper function to check if an error is a specific Prisma error
 */
export function isPrismaError(error: unknown, code: PrismaErrorCode): boolean {
  return error instanceof Error && 'code' in error && error.code === code
}

export function isRetryableTransactionError(error: unknown): boolean {
  if (isPrismaError(error, PRISMA_ERROR_CODES.TRANSACTION_FAILED)) return true
  if (
    !(error instanceof Error) ||
    !('code' in error) ||
    error.code !== PRISMA_ERROR_CODES.RAW_QUERY_FAILED ||
    !('meta' in error) ||
    typeof error.meta !== 'object' ||
    error.meta === null ||
    !('driverAdapterError' in error.meta)
  ) {
    return false
  }

  const adapterError = error.meta.driverAdapterError
  if (typeof adapterError !== 'object' || adapterError === null || !('cause' in adapterError)) {
    return false
  }

  const cause = adapterError.cause
  if (typeof cause !== 'object' || cause === null || !('originalCode' in cause)) return false

  // Prisma's raw-query path preserves PostgreSQL conflicts inside P2010, rather than P2034.
  return cause.originalCode === '40001' || cause.originalCode === '40P01'
}

/**
 * Helper function to extract the constraining field from a unique constraint violation
 */
export function getConstraintField(error: unknown): string | null {
  if (isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)) {
    // P2002 errors include metadata about the constraint
    const prismaError = error as { meta?: { target?: string[] } }
    return prismaError.meta?.target?.[0] ?? null
  }
  return null
}
