import { type ZodSchema } from 'zod'

/**
 * Client-side validation for untrusted data (e.g., localStorage, cookies)
 * Returns the validated data or the fallback value if validation fails
 */
export function safeParseJSON<T>(
  text: string,
  schema: ZodSchema<T>,
  fallback: T,
): T {
  try {
    const parsed = JSON.parse(text)
    const result = schema.safeParse(parsed)

    if (result.success) {
      return result.data
    }

    console.warn('Validation failed:', result.error.flatten())
    return fallback
  } catch (error) {
    console.warn('JSON parse failed:', error)
    return fallback
  }
}

/**
 * Validates already parsed data against a schema
 * Returns validated data or fallback if validation fails
 */
export function validateClientData<T>(
  data: unknown,
  schema: ZodSchema<T>,
  fallback: T,
): T {
  const result = schema.safeParse(data)

  if (result.success) return result.data

  console.warn('Client validation failed:', result.error.flatten())
  return fallback
}
