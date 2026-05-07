import { type FieldErrors, type FieldPath, type FieldValues } from 'react-hook-form'

// Walks dotted paths like `customFieldValues.0.value` so nested array
// field errors resolve correctly.
export function readFieldError<TValues extends FieldValues>(
  errors: FieldErrors<TValues>,
  name: FieldPath<TValues>,
): string {
  const segments = name.split('.')
  let current: unknown = errors
  for (const segment of segments) {
    if (current === null || typeof current !== 'object') return ''
    current = (current as Record<string, unknown>)[segment]
  }
  if (current && typeof current === 'object' && 'message' in current) {
    const message = (current as { message?: unknown }).message
    return typeof message === 'string' ? message : message == null ? '' : String(message)
  }
  return ''
}
