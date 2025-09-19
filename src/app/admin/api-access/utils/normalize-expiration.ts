/**
 * Normalizes an expiration date string to ISO format and validates it.
 * Returns an object with the ISO string and any error message.
 * @param value
 */
export function normalizeExpiration(value: string | null | undefined) {
  if (!value) {
    return { iso: null, error: null }
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return { iso: null, error: 'Enter a valid expiration date and time.' }
  }

  if (parsed.getTime() <= Date.now()) {
    return { iso: null, error: 'Expiration must be in the future.' }
  }

  return { iso: parsed.toISOString(), error: null }
}
