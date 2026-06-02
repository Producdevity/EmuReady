// noinspection ExceptionCaughtLocallyJS

import { TRPCError } from '@trpc/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isTurnstileConfigured,
  verifyTurnstileToken,
} from '@/features/human-verification/server/providers/turnstile'
import {
  HUMAN_VERIFICATION_ERROR_CODES,
  HUMAN_VERIFICATION_TOKEN_MAX_LENGTH,
} from '@/features/human-verification/shared/constants'
import analytics from '@/lib/analytics'
import { type PrismaClient } from '@orm/client'
import { checkSpamContent } from './spam-check'
import { SpamDetectionService } from './spamDetection'

vi.mock('@/lib/analytics', () => ({
  default: {
    contentQuality: {
      spamDetected: vi.fn(),
    },
  },
}))

vi.mock('@/features/human-verification/server/providers/turnstile', () => ({
  getRequestIp: vi.fn(() => undefined),
  isTurnstileConfigured: vi.fn(() => true),
  verifyTurnstileToken: vi.fn(),
}))

const mockPrisma = {} as unknown as PrismaClient

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(isTurnstileConfigured).mockReturnValue(true)
  vi.mocked(verifyTurnstileToken).mockResolvedValue({
    success: false,
    errorCodes: ['test-default'],
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('checkSpamContent', () => {
  const USER_ID = 'user-123'

  it('returns without side effects when content is not spam', async () => {
    const detectSpy = vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: false,
      confidence: 0.1,
      method: 'content_analysis',
    })

    await expect(
      checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'Clean content',
        entityType: 'listing',
      }),
    ).resolves.toBeUndefined()

    expect(detectSpy).toHaveBeenCalledOnce()
    expect(analytics.contentQuality.spamDetected).not.toHaveBeenCalled()
  })

  it('emits analytics and throws AppError.badRequest with reason when spam is detected', async () => {
    vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: true,
      confidence: 0.85,
      method: 'pattern_matching',
      reason: 'Spam pattern matched',
    })

    await expect(
      checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'Flagged content',
        entityType: 'listing',
      }),
    ).rejects.toThrow(/Spam detected: Spam pattern matched/)

    expect(analytics.contentQuality.spamDetected).toHaveBeenCalledTimes(1)
    expect(analytics.contentQuality.spamDetected).toHaveBeenCalledWith({
      entityType: 'listing',
      entityId: USER_ID,
      confidence: 0.85,
      method: 'pattern_matching',
    })
  })

  it('throws TOO_MANY_REQUESTS when rate limiting flags the content', async () => {
    vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: true,
      confidence: 0.95,
      method: 'rate_limiting',
      reason: 'Too many recent reports. Please wait and try again.',
    })

    try {
      await checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'Flagged content',
        entityType: 'listing',
      })
      throw new Error('Expected checkSpamContent to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError)
      expect((error as TRPCError).code).toBe('TOO_MANY_REQUESTS')
      expect((error as TRPCError).message).toContain('Too many recent reports')
    }
  })

  it('honors the test rate-limit bypass used by E2E runs', async () => {
    vi.stubEnv('DISABLE_RATE_LIMIT', 'true')
    const rateLimitedPrisma = {
      listing: {
        count: vi.fn().mockResolvedValue(5),
        findMany: vi.fn().mockResolvedValue([]),
      },
      pcListing: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
      comment: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
      pcListingComment: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
    }

    await expect(
      checkSpamContent({
        prisma: rateLimitedPrisma as unknown as PrismaClient,
        userId: USER_ID,
        content: 'Normal report notes from an end-to-end setup run.',
        entityType: 'listing',
      }),
    ).resolves.toBeUndefined()

    expect(rateLimitedPrisma.listing.count).not.toHaveBeenCalled()
    expect(rateLimitedPrisma.pcListing.count).not.toHaveBeenCalled()
  })

  it('falls back to the community-guidelines message when reason is missing', async () => {
    vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: true,
      confidence: 0.8,
      method: 'pattern_matching',
    })

    await expect(
      checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'Looks spammy but no explicit reason',
        entityType: 'comment',
      }),
    ).rejects.toThrow(/community guidelines/i)
  })

  it('throws a BAD_REQUEST TRPCError', async () => {
    vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: true,
      confidence: 0.9,
      method: 'duplicate_detection',
      reason: 'Duplicate of recent submission',
    })

    try {
      await checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'duplicate',
        entityType: 'comment',
      })
      throw new Error('Expected checkSpamContent to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError)
      expect((error as TRPCError).code).toBe('BAD_REQUEST')
    }
  })

  it('requires human verification for challengeable spam when challenge mode is enabled', async () => {
    vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: true,
      confidence: 0.85,
      method: 'pattern_matching',
      reason: 'Spam pattern matched',
    })

    try {
      await checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'Flagged content',
        entityType: 'comment',
        challengeMode: 'challenge',
      })
      throw new Error('Expected checkSpamContent to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError)
      expect((error as TRPCError).code).toBe('BAD_REQUEST')
      expect((error as TRPCError).cause).toEqual(
        expect.objectContaining({
          code: HUMAN_VERIFICATION_ERROR_CODES.REQUIRED,
          provider: 'turnstile',
          action: 'content_submission',
        }),
      )
    }
  })

  it('allows challengeable spam after a valid human verification token', async () => {
    vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: true,
      confidence: 0.85,
      method: 'pattern_matching',
      reason: 'Spam pattern matched',
    })
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: true, errorCodes: [] })

    await expect(
      checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'Flagged content',
        entityType: 'comment',
        challengeMode: 'challenge',
        humanVerificationToken: 'valid-token',
      }),
    ).resolves.toBeUndefined()

    expect(verifyTurnstileToken).toHaveBeenCalledWith({
      token: 'valid-token',
      remoteIp: undefined,
    })
  })

  it('rejects oversized human verification tokens before calling the provider', async () => {
    vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: true,
      confidence: 0.85,
      method: 'pattern_matching',
      reason: 'Spam pattern matched',
    })

    try {
      await checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'Flagged content',
        entityType: 'comment',
        challengeMode: 'challenge',
        humanVerificationToken: 'a'.repeat(HUMAN_VERIFICATION_TOKEN_MAX_LENGTH + 1),
      })
      throw new Error('Expected checkSpamContent to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError)
      expect((error as TRPCError).cause).toEqual(
        expect.objectContaining({
          code: HUMAN_VERIFICATION_ERROR_CODES.FAILED,
        }),
      )
    }

    expect(verifyTurnstileToken).not.toHaveBeenCalled()
  })

  it('does not allow high-confidence spam with a human verification token', async () => {
    vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: true,
      confidence: 0.99,
      method: 'pattern_matching',
      reason: 'Multiple spam patterns matched',
    })

    await expect(
      checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'Flagged content',
        entityType: 'comment',
        challengeMode: 'challenge',
        humanVerificationToken: 'valid-token',
      }),
    ).rejects.toThrow(/Multiple spam patterns matched/)

    expect(verifyTurnstileToken).not.toHaveBeenCalled()
  })

  it('fails closed when human verification is not configured for a challenge', async () => {
    vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: true,
      confidence: 0.85,
      method: 'pattern_matching',
      reason: 'Spam pattern matched',
    })
    vi.mocked(isTurnstileConfigured).mockReturnValue(false)

    try {
      await checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'Flagged content',
        entityType: 'comment',
        challengeMode: 'challenge',
        humanVerificationToken: 'token',
      })
      throw new Error('Expected checkSpamContent to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError)
      expect((error as TRPCError).code).toBe('INTERNAL_SERVER_ERROR')
      expect((error as TRPCError).cause).toEqual(
        expect.objectContaining({
          code: HUMAN_VERIFICATION_ERROR_CODES.UNAVAILABLE,
        }),
      )
    }
  })

  it('does not issue an impossible challenge when human verification is not configured', async () => {
    vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: true,
      confidence: 0.85,
      method: 'pattern_matching',
      reason: 'Spam pattern matched',
    })
    vi.mocked(isTurnstileConfigured).mockReturnValue(false)

    try {
      await checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'Flagged content',
        entityType: 'comment',
        challengeMode: 'challenge',
      })
      throw new Error('Expected checkSpamContent to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError)
      expect((error as TRPCError).code).toBe('INTERNAL_SERVER_ERROR')
      expect((error as TRPCError).cause).toEqual(
        expect.objectContaining({
          code: HUMAN_VERIFICATION_ERROR_CODES.UNAVAILABLE,
        }),
      )
    }
  })
})
