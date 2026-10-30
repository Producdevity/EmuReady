import { type TRPCError } from '@trpc/server'
import { getHTTPStatusCodeFromError } from '@trpc/server/http'
import { logger } from '@/lib/logger'

export function reportTRPCError(error: TRPCError, path: string | undefined): void {
  if (getHTTPStatusCodeFromError(error) < 500) return

  logger.error('[tRPC] Server error', error.cause ?? error, {
    procedure: path ?? '<unknown>',
    code: error.code,
  })
}
