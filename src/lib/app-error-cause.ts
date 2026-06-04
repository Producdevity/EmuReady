export function getSerializableAppError(cause: unknown): Record<string, unknown> | null {
  if (!cause || typeof cause !== 'object') return null

  const payload = cause as Record<string, unknown>
  // tRPC wraps `cause` in an Error and superjson strips custom props off Errors; copy to a plain object.
  return typeof payload.code === 'string' ? { ...payload } : null
}
