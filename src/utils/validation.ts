/**
 * Validates if a string is in proper UUID format
 * @param value - The string to check
 * @returns true if the string is a valid UUID
 */
export function isUuid(value: string): boolean {
  // UUID v4 regex pattern
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidPattern.test(value)
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeString(input: string): string {
  return String(input || '')
    .trim()
    .replace(/[<>(){}[\]\\\/=+]/g, '') // Remove potentially dangerous characters
}

/**
 * Validates that an email is in proper format
 * @param email - The email to validate
 * @returns true if the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailPattern.test(email)
}
