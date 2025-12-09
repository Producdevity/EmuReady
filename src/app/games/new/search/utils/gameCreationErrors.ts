import { toast } from 'sonner'
import { APP_ERROR_CODES } from '@/lib/errors'
import getErrorMessage from '@/utils/getErrorMessage'

export type GameCreationErrorResult =
  | { type: 'submissionLimit'; reportsNeeded: number }
  | { type: 'duplicate'; existingGameId: string }
  | { type: 'duplicateNoId' }
  | { type: 'generic' }

interface ErrorCause {
  code?: string
  existingGameId?: string
  reportsNeeded?: number
}

/**
 * Extracts the error cause from a tRPC error.
 * tRPC wraps errors, so we need to check both direct and nested cause.
 */
function getErrorCause(error: unknown): ErrorCause | undefined {
  const err = error as { cause?: ErrorCause; data?: { cause?: ErrorCause } }
  return err?.cause ?? err?.data?.cause
}

/**
 * Handles errors from game creation mutations.
 * Uses error codes from cause for reliable error identification instead of string matching.
 *
 * @param error - The error thrown by the mutation
 * @returns Object indicating the error type and any relevant data
 */
export function handleGameCreationError(error: unknown): GameCreationErrorResult {
  const errorMessage = getErrorMessage(error, 'Failed to add game')
  const cause = getErrorCause(error)

  // Check error code from cause for reliable identification
  switch (cause?.code) {
    case APP_ERROR_CODES.GAME_SUBMISSION_LIMIT_EXCEEDED: {
      toast.error(errorMessage, {
        duration: 10000,
        description: 'Add compatibility reports for existing games to unlock more submissions.',
      })
      return { type: 'submissionLimit', reportsNeeded: cause.reportsNeeded ?? 1 }
    }

    case APP_ERROR_CODES.GAME_ALREADY_EXISTS: {
      if (cause.existingGameId) {
        toast.info('Game already exists.')
        return { type: 'duplicate', existingGameId: cause.existingGameId }
      }
      toast.error(errorMessage)
      return { type: 'duplicateNoId' }
    }
  }

  // Generic error - no recognized error code
  toast.error(errorMessage)
  return { type: 'generic' }
}
