import { isString, isError } from 'remeda'

export const DEFAULT_ERROR_MESSAGE = 'Unknown error occurred.'

function getErrorMessage(
  error: unknown,
  fallbackMessage = DEFAULT_ERROR_MESSAGE,
): string {
  if (isError(error)) return error.message
  if (isString(error)) return error
  return fallbackMessage
}

export default getErrorMessage
