import { logger } from '@/lib/logger'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'

interface HandheldParams {
  error: unknown
  listingId: string
}

export function logHandheldVoteError(params: HandheldParams): void {
  logger.error('[ListingDetailsClient] handleVoting:', params.error, {
    listingId: params.listingId,
  })
  toast.error(`Failed to vote: ${getErrorMessage(params.error)}`)
}

interface PcParams {
  error: unknown
  pcListingId: string
}

export function logPcVoteError(params: PcParams): void {
  logger.error('[PcListingDetailsClient] handleVoting:', params.error, {
    pcListingId: params.pcListingId,
  })
  toast.error(`Failed to vote: ${getErrorMessage(params.error)}`)
}
