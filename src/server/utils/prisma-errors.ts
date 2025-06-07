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

  // Connection errors
  CONNECTION_ERROR: 'P1000',
  CONNECTION_TIMEOUT: 'P1008',

  // Schema errors
  FIELD_NOT_FOUND: 'P2009',
  MISSING_REQUIRED_VALUE: 'P2012',
  INVALID_VALUE: 'P2007',
} as const

export type PrismaErrorCode =
  (typeof PRISMA_ERROR_CODES)[keyof typeof PRISMA_ERROR_CODES]

/**
 * Helper function to check if an error is a specific Prisma error
 */
export function isPrismaError(error: unknown, code: PrismaErrorCode): boolean {
  return error instanceof Error && 'code' in error && error.code === code
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
