import { TRPCError } from '@trpc/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import analytics from '@/lib/analytics'
import { type PrismaClient } from '@orm'
import { checkSpamContent } from './spam-check'
import { SpamDetectionService } from './spamDetection'

vi.mock('@/lib/analytics', () => ({
  default: {
    contentQuality: {
      spamDetected: vi.fn(),
    },
  },
}))

const mockPrisma = {} as unknown as PrismaClient

afterEach(() => vi.restoreAllMocks())

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

  it('emits analytics and throws AppError.badRequest with reason when spam detected', async () => {
    vi.spyOn(SpamDetectionService.prototype, 'detectSpam').mockResolvedValue({
      isSpam: true,
      confidence: 0.95,
      method: 'rate_limiting',
      reason: 'Exceeded rate limit: 4 listings in 5 minutes',
    })

    await expect(
      checkSpamContent({
        prisma: mockPrisma,
        userId: USER_ID,
        content: 'Flagged content',
        entityType: 'listing',
      }),
    ).rejects.toThrow(/Spam detected: Exceeded rate limit/)

    expect(analytics.contentQuality.spamDetected).toHaveBeenCalledTimes(1)
    expect(analytics.contentQuality.spamDetected).toHaveBeenCalledWith({
      entityType: 'listing',
      entityId: USER_ID,
      confidence: 0.95,
      method: 'rate_limiting',
    })
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
})
