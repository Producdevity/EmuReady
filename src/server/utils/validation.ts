import { z, type ZodSchema } from 'zod'
import { AppError } from '@/lib/errors'

interface ValidationOptions {
  customMessage?: string
}

/**
 * Enhanced validation with detailed error messages
 */
export function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options?: ValidationOptions,
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = options?.customMessage || formatZodError(error)
      throw AppError.badRequest(message)
    }
    throw error
  }
}

/**
 * Format Zod errors into user-friendly messages
 */
export function formatZodError(error: z.ZodError): string {
  const messages = error.errors.map((err) => {
    const path = err.path.join('.')
    const prefix = path ? `${path}: ` : ''
    return `${prefix}${err.message}`
  })

  return messages.join('; ')
}
