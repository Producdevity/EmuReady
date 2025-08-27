import { AppError } from '@/lib/errors'

/**
 * Security validation utilities for critical runtime parameters
 * Ensures data integrity and prevents security vulnerabilities
 */

/**
 * Validates that a parameter is not null or undefined
 * Provides clear error messages for missing parameters
 */
export function validateRequired<T>(
  value: T | null | undefined,
  parameterName: string,
): asserts value is T {
  if (value === null || value === undefined) {
    AppError.missingRequiredField(parameterName)
  }
}

/**
 * Validates that an array is not empty
 * Ensures operations have required data
 */
export function validateNonEmptyArray<T>(
  array: T[] | undefined | null,
  parameterName: string,
): asserts array is T[] {
  if (!array || !Array.isArray(array) || array.length === 0) {
    AppError.badRequest(`${parameterName} must be a non-empty array`)
  }
}

/**
 * Validates that a string matches expected format
 * Prevents injection attacks and malformed data
 */
export function validateStringFormat(
  value: string,
  pattern: RegExp,
  parameterName: string,
  formatDescription: string = 'the expected format',
): void {
  if (!pattern.test(value)) {
    AppError.badRequest(`${parameterName} must match ${formatDescription}`)
  }
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?'"]+$/,
} as const

/**
 * Validates that a value is within an allowed enum
 * Prevents invalid enum values from being processed
 */
export function validateEnum<T extends string>(
  value: unknown,
  enumValues: readonly T[],
  parameterName: string,
): asserts value is T {
  if (!enumValues.includes(value as T)) {
    AppError.badRequest(`${parameterName} must be one of: ${enumValues.join(', ')}`)
  }
}

/**
 * Validates pagination parameters
 * Prevents excessive data retrieval
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
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}
