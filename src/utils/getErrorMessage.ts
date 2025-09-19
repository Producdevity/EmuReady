import { isString, isError } from 'remeda'

export const DEFAULT_ERROR_MESSAGE = 'Unknown error occurred.'

function getErrorMessage(error: unknown, fallbackMessage = DEFAULT_ERROR_MESSAGE): string {
  if (isError(error)) return error.message
  if (isString(error)) {
    const parsed = tryParseJson(error)
    if (!parsed) return error

    if (Array.isArray(parsed)) {
      const messages = parsed
        .map((item) => extractMessage(item))
        .filter((message): message is string => Boolean(message))
      if (messages.length > 0) {
        return messages.join('\n')
      }
    } else {
      const message = extractMessage(parsed)
      if (message) return message
    }
  }
  return fallbackMessage
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function extractMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const candidate = payload as { message?: unknown }
  if (typeof candidate.message === 'string') {
    return candidate.message
  }
  return null
}

export default getErrorMessage
