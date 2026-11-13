// TODO: Replace this module with schema-level validation and purpose-built sanitization; see #442.

/**
 * Validates pagination parameters
 * Prevents excessive data retrieval
 * TODO: Move pagination constraints into Zod input schemas and delete this helper; see #442.
 */
export function validatePagination(
  page?: number,
  limit?: number,
  maxLimit: number = 100,
): { page: number; limit: number } {
  const validPage = page && page > 0 ? page : 1
  const validLimit = limit && limit > 0 ? Math.min(limit, maxLimit) : 20

  return { page: validPage, limit: validLimit }
}
