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

/**
 * Sanitizes user input to prevent XSS and injection
 * Removes potentially dangerous characters
 * TODO: Replace denylist sanitization with field-specific escaping or a sanitizer library; see #442.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}
