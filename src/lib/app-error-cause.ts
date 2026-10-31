import { APP_ERROR_CODES } from './errors'

export function getSerializableAppError(cause: unknown): Record<string, unknown> | null {
  if (!cause || typeof cause !== 'object' || !('code' in cause)) return null

  // tRPC wraps `cause` in an Error and superjson strips custom props off Errors; copy to a plain object.
  return Object.values(APP_ERROR_CODES).some((code) => code === cause.code) ? { ...cause } : null
}
