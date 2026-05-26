export function getSerializableAppError(cause: unknown): Record<string, unknown> | null {
  if (!cause || typeof cause !== 'object') return null

  const payload = cause as Record<string, unknown>
  return typeof payload.code === 'string' ? payload : null
}
