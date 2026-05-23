import { afterEach, describe, expect, it, vi } from 'vitest'
import { logger } from '@/lib/logger'
import toast from '@/lib/toast'
import { logHandheldVoteError, logPcVoteError } from './logVoteError'

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

vi.mock('@/lib/toast', () => ({
  default: {
    error: vi.fn(),
  },
}))

vi.mock('@/utils/getErrorMessage', () => ({
  default: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}))

afterEach(() => vi.clearAllMocks())

describe('logHandheldVoteError', () => {
  const LISTING_ID = '00000000-0000-4000-a000-000000000010'

  it('passes listingId as extra context to logger.error', () => {
    const error = new Error('Network down')

    logHandheldVoteError({ error, listingId: LISTING_ID })

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith('[ListingDetailsClient] handleVoting:', error, {
      listingId: LISTING_ID,
    })
  })

  it('calls toast.error with a user-facing message derived from the error', () => {
    logHandheldVoteError({ error: new Error('Forbidden'), listingId: LISTING_ID })

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith('Failed to vote: Forbidden')
  })

  it('handles non-Error thrown values without crashing', () => {
    logHandheldVoteError({ error: 'bare string', listingId: LISTING_ID })

    expect(logger.error).toHaveBeenCalledWith(
      '[ListingDetailsClient] handleVoting:',
      'bare string',
      { listingId: LISTING_ID },
    )
    expect(toast.error).toHaveBeenCalledWith('Failed to vote: bare string')
  })
})

describe('logPcVoteError', () => {
  const PC_LISTING_ID = '00000000-0000-4000-a000-000000000011'

  it('passes pcListingId as extra context to logger.error', () => {
    const error = new Error('CAPTCHA failed')

    logPcVoteError({ error, pcListingId: PC_LISTING_ID })

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith('[PcListingDetailsClient] handleVoting:', error, {
      pcListingId: PC_LISTING_ID,
    })
  })

  it('uses the PC-specific prefix (not the handheld one)', () => {
    logPcVoteError({ error: new Error('err'), pcListingId: PC_LISTING_ID })

    const firstArg = vi.mocked(logger.error).mock.calls[0]?.[0]
    expect(firstArg).toBe('[PcListingDetailsClient] handleVoting:')
  })
})
