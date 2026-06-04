import { isTRPCClientError } from '@trpc/client'
import type { AppRouter } from '@/types/trpc'

const MAX_QUERY_RETRIES = 3
const NOT_FOUND_ERROR_CODE = 'NOT_FOUND'

export function isTRPCNotFoundError(error: unknown): boolean {
  return isTRPCClientError<AppRouter>(error) && error.data?.code === NOT_FOUND_ERROR_CODE
}

export function shouldRetryTRPCQuery(failureCount: number, error: Error): boolean {
  return !isTRPCNotFoundError(error) && failureCount < MAX_QUERY_RETRIES
}

export function getAppErrorData(error: unknown): Record<string, unknown> | null {
  if (!isTRPCClientError<AppRouter>(error)) return null
  return error.data?.appError ?? null
}
