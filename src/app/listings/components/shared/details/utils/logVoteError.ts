import { type ListingType } from '@/lib/api/useListingApi'
import { logger } from '@/lib/logger'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'

interface Params {
  error: unknown
  listingId: string
  listingType: ListingType
}

export function logListingVoteError(params: Params): void {
  const isPc = params.listingType === 'pc'
  const prefix = isPc ? '[PcListingDetailsClient]' : '[ListingDetailsClient]'
  const contextField = isPc ? 'pcListingId' : 'listingId'

  logger.error(`${prefix} handleVoting:`, params.error, {
    [contextField]: params.listingId,
  })
  toast.error(`Failed to vote: ${getErrorMessage(params.error)}`)
}
