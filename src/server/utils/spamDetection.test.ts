import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type PrismaClient } from '@orm'
import { SpamDetectionService } from './spamDetection'

const mockPrisma = {
  listing: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  comment: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
} as unknown as PrismaClient

describe('SpamDetectionService', () => {
  let service: SpamDetectionService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new SpamDetectionService(mockPrisma)
  })

  describe('Rate Limiting Detection', () => {
    it('should detect spam when rate limit is exceeded for listings', async () => {
      // Mock: User has created 4 listings in the last 5 minutes (exceeds default max of 3)
      vi.mocked(mockPrisma.listing.count).mockResolvedValue(4)

      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Normal content',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(true)
      expect(result.confidence).toBe(0.95)
      expect(result.method).toBe('rate_limiting')
      expect(result.reason).toContain('Exceeded rate limit')
    })

    it('should NOT detect spam when within rate limit', async () => {
      // Mock: User has created 2 listings in the last 5 minutes (within limit)
      vi.mocked(mockPrisma.listing.count).mockResolvedValue(2)
      vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([])

      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Normal content',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(false)
    })

    it('should detect spam when rate limit is exceeded for comments', async () => {
      // Mock: User has created 5 comments in the last 5 minutes
      vi.mocked(mockPrisma.comment.count).mockResolvedValue(5)

      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Normal content',
        entityType: 'comment',
      })

      expect(result.isSpam).toBe(true)
      expect(result.confidence).toBe(0.95)
      expect(result.method).toBe('rate_limiting')
    })
  })

  describe('Duplicate Content Detection', () => {
    it('should detect spam when duplicate listings are found', async () => {
      // Mock: Rate limit passes
      vi.mocked(mockPrisma.listing.count).mockResolvedValue(1)

      // Mock: User has 3 similar listings in the last 24 hours
      vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([
        { notes: 'This is spam content' },
        { notes: 'This is spam content' },
        { notes: 'This is spam content' },
      ] as any)

      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'This is spam content',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(true)
      expect(result.confidence).toBe(0.9)
      expect(result.method).toBe('duplicate_detection')
      expect(result.reason).toContain('very similar')
    })

    it('should detect spam when duplicate comments are found', async () => {
      // Mock: Rate limit passes
      vi.mocked(mockPrisma.comment.count).mockResolvedValue(1)

      // Mock: User has 3 similar comments
      vi.mocked(mockPrisma.comment.findMany).mockResolvedValue([
        { content: 'Spam comment here' },
        { content: 'Spam comment here' },
        { content: 'Spam comment here' },
      ] as any)

      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Spam comment here',
        entityType: 'comment',
      })

      expect(result.isSpam).toBe(true)
      expect(result.confidence).toBe(0.9)
      expect(result.method).toBe('duplicate_detection')
    })

    it('should NOT detect spam for slightly different content', async () => {
      // Mock: Rate limit passes
      vi.mocked(mockPrisma.listing.count).mockResolvedValue(1)

      // Mock: User has listings with different content
      vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([
        { notes: 'Game runs great on my device' },
        { notes: 'Performance is excellent with these settings' },
      ] as any)

      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Works perfectly with latest driver version',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(false)
    })
  })

  describe('Content Analysis', () => {
    beforeEach(() => {
      // Mock: Rate limit and duplicate checks pass
      vi.mocked(mockPrisma.listing.count).mockResolvedValue(1)
      vi.mocked(mockPrisma.comment.count).mockResolvedValue(1)
      vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([])
      vi.mocked(mockPrisma.comment.findMany).mockResolvedValue([])
    })

    it('should detect spam with excessive capitalization', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'THIS IS ALL CAPS AND LOOKS LIKE SPAM!!!',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(true)
      expect(result.method).toBe('content_analysis')
      expect(result.reason).toContain('excessive capitalization')
    })

    it('should detect spam with excessive punctuation', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Amazing!!! You must see this!!! So great!!!',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(true)
      expect(result.method).toBe('content_analysis')
      expect(result.reason).toContain('excessive punctuation')
    })

    it('should detect spam with repeated characters', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Wooooooow this is amaaaaazing!!!!!',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(true)
      expect(result.method).toBe('content_analysis')
      expect(result.reason).toContain('repeated characters')
    })

    it('should detect spam with suspicious URLs', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Check out this amazing deal at bit.ly/spam123',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(true)
      expect(result.method).toBe('content_analysis')
      expect(result.reason).toContain('suspicious shortened URLs')
    })

    it('should detect spam with excessive emojis combined with other signals', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'GREAT GAME!!! 😀😁😂🤣😃😄😅😆😉😊😋😎😍',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(true)
      expect(result.method).toBe('content_analysis')
      expect(result.reason).toContain('excessive emoji')
    })

    it('should NOT detect spam with normal content', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Game runs smoothly at 60fps with these settings. Highly recommended!',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(false)
    })

    it('should handle mixed spam characteristics', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'CLICK HERE NOW!!!! bit.ly/spam Amaaaaaazing deal!!!',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.reason).toContain('repeated characters')
      expect(result.reason).toContain('suspicious shortened URLs')
    })
  })

  describe('Pattern Matching', () => {
    beforeEach(() => {
      // Mock: All other checks pass
      vi.mocked(mockPrisma.listing.count).mockResolvedValue(1)
      vi.mocked(mockPrisma.comment.count).mockResolvedValue(1)
      vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([])
      vi.mocked(mockPrisma.comment.findMany).mockResolvedValue([])
    })

    it('should detect spam with "click here" pattern', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Click here to get free items',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(true)
      expect(result.confidence).toBe(0.99)
      expect(result.method).toBe('pattern_matching')
      expect(result.reason?.toLowerCase()).toContain('click here')
    })

    it('should detect spam with "buy now" pattern', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Buy now and get 50% off',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(true)
      expect(result.method).toBe('pattern_matching')
    })

    it('should detect spam with pharmacy keywords', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Cheap meds available online pharmacy',
        entityType: 'comment',
      })

      expect(result.isSpam).toBe(true)
      expect(result.method).toBe('pattern_matching')
    })

    it('should detect spam with casino keywords', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Visit our casino and play poker',
        entityType: 'comment',
      })

      expect(result.isSpam).toBe(true)
      expect(result.method).toBe('pattern_matching')
    })

    it('should detect spam with MLM keywords', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'Join our mlm program and work from home',
        entityType: 'comment',
      })

      expect(result.isSpam).toBe(true)
      expect(result.method).toBe('pattern_matching')
    })

    it('should NOT detect legitimate gaming content', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'This game is great! Performance is excellent on my Steam Deck.',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(false)
    })
  })

  describe('Configuration', () => {
    it('should respect custom rate limit configuration', async () => {
      const customService = new SpamDetectionService(mockPrisma, {
        rateLimitMax: 10,
        rateLimitWindow: 10,
      })

      // Mock: User has 9 listings (below custom limit of 10)
      vi.mocked(mockPrisma.listing.count).mockResolvedValue(9)
      vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([])

      const result = await customService.detectSpam({
        userId: 'user-123',
        content: 'Normal content',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(false)
    })

    it('should allow disabling specific detection methods', async () => {
      const customService = new SpamDetectionService(mockPrisma, {
        enableContentAnalysis: false,
        enablePatternMatching: false,
      })

      vi.mocked(mockPrisma.listing.count).mockResolvedValue(1)
      vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([])

      const result = await customService.detectSpam({
        userId: 'user-123',
        content: 'SPAM SPAM SPAM click here buy now!!!',
        entityType: 'listing',
      })

      // Should pass since content analysis and pattern matching are disabled
      expect(result.isSpam).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.mocked(mockPrisma.listing.count).mockResolvedValue(1)
      vi.mocked(mockPrisma.comment.count).mockResolvedValue(1)
      vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([])
      vi.mocked(mockPrisma.comment.findMany).mockResolvedValue([])
    })

    it('should handle empty content', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: '',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(false)
    })

    it('should handle very short content', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'OK',
        entityType: 'comment',
      })

      expect(result.isSpam).toBe(false)
    })

    it('should handle special characters', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: '¡Hola! ¿Cómo estás? 你好',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(false)
    })

    it('should handle null notes in listing', async () => {
      vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([
        { notes: null },
        { notes: 'Some content' },
      ] as any)

      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'New content',
        entityType: 'listing',
      })

      // Should not throw error
      expect(result).toBeDefined()
    })
  })

  describe('Real-world Scenarios', () => {
    beforeEach(() => {
      vi.mocked(mockPrisma.listing.count).mockResolvedValue(1)
      vi.mocked(mockPrisma.comment.count).mockResolvedValue(1)
      vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([])
      vi.mocked(mockPrisma.comment.findMany).mockResolvedValue([])
    })

    it('should allow legitimate technical content', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content:
          'Works perfectly on Steam Deck with latest Proton GE. GPU driver 535.104.05. Settings: 720p, Medium graphics, 60fps cap. Battery life is about 3-4 hours.',
        entityType: 'listing',
      })

      expect(result.isSpam).toBe(false)
    })

    it('should allow legitimate reviews with enthusiasm', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content:
          'This game is AMAZING! The graphics are incredible and performance is solid. Highly recommend trying it on your device!',
        entityType: 'comment',
      })

      // Some enthusiasm is ok, shouldn't be flagged as spam
      expect(result.isSpam).toBe(false)
    })

    it('should catch obvious spam attempts', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content:
          'BEST DEAL EVER!!! Click here NOW for FREE MONEY!!! Limited time offer!!! bit.ly/getrich',
        entityType: 'comment',
      })

      expect(result.isSpam).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should catch SEO spam', async () => {
      const result = await service.detectSpam({
        userId: 'user-123',
        content: 'casino poker online gambling bet win money lottery jackpot',
        entityType: 'comment',
      })

      expect(result.isSpam).toBe(true)
      expect(result.method).toBe('pattern_matching')
    })
  })

  describe('Helper Methods - Actual Algorithm Tests', () => {
    describe('normalizeContent', () => {
      it('should convert to lowercase', () => {
        const result = service.normalizeContent('HELLO World')
        expect(result).toBe('hello world')
      })

      it('should remove punctuation', () => {
        const result = service.normalizeContent('Hello, World! How are you?')
        expect(result).toBe('hello world how are you')
      })

      it('should normalize multiple spaces', () => {
        const result = service.normalizeContent('Hello    World   Test')
        expect(result).toBe('hello world test')
      })

      it('should trim whitespace', () => {
        const result = service.normalizeContent('  Hello World  ')
        expect(result).toBe('hello world')
      })

      it('should handle special characters', () => {
        const result = service.normalizeContent('Hello@#$%World!!!')
        expect(result).toBe('helloworld')
      })

      it('should handle empty string', () => {
        const result = service.normalizeContent('')
        expect(result).toBe('')
      })

      it('should handle unicode characters', () => {
        const result = service.normalizeContent('Café ñoño 你好')
        expect(result).toMatch(/caf/)
        expect(result).not.toContain('é')
      })
    })

    describe('calculateSimilarity', () => {
      it('should return 1.0 for identical strings', () => {
        const similarity = service.calculateSimilarity('hello world', 'hello world')
        expect(similarity).toBe(1.0)
      })

      it('should return 0.0 for completely different strings', () => {
        const similarity = service.calculateSimilarity('hello world', 'foo bar')
        expect(similarity).toBe(0.0)
      })

      it('should detect partial overlap', () => {
        const similarity = service.calculateSimilarity('hello world test', 'hello world example')
        expect(similarity).toBeGreaterThanOrEqual(0.5)
        expect(similarity).toBeLessThan(1.0)
      })

      it('should handle word order differences (acceptable for spam detection)', () => {
        const similarity = service.calculateSimilarity('great game runs', 'runs game great')
        expect(similarity).toBe(1.0)
      })

      it('should properly handle word frequency differences', () => {
        const similarity = service.calculateSimilarity('spam spam spam', 'spam')
        expect(similarity).toBeCloseTo(0.33, 1)
      })

      it('should detect repeated spam patterns', () => {
        const text1 = 'buy buy buy now now'
        const text2 = 'buy now'
        const similarity = service.calculateSimilarity(text1, text2)
        expect(similarity).toBeLessThan(0.5)
      })

      it('should handle repeated words adding to dissimilarity', () => {
        const similarity = service.calculateSimilarity('hello world', 'hello world extra words')
        expect(similarity).toBeGreaterThanOrEqual(0.5)
        expect(similarity).toBeLessThan(1.0)
      })

      it('should calculate similarity for realistic spam cases', () => {
        const original = 'buy now limited offer click here'
        const variant = 'buy now limited time click here'
        const similarity = service.calculateSimilarity(original, variant)
        expect(similarity).toBeGreaterThan(0.7)
      })

      it('should show low similarity for legitimate variations', () => {
        const text1 = 'game runs perfectly on my device with latest drivers'
        const text2 = 'excellent performance with optimal settings and good battery'
        const similarity = service.calculateSimilarity(text1, text2)
        expect(similarity).toBeLessThan(0.3)
      })

      it('should handle empty strings', () => {
        const similarity = service.calculateSimilarity('', '')
        expect(similarity).toBe(1)
      })

      it('should handle one empty string', () => {
        const similarity = service.calculateSimilarity('hello', '')
        expect(similarity).toBe(0)
      })
    })

    describe('Content Analysis Patterns', () => {
      beforeEach(() => {
        vi.mocked(mockPrisma.listing.count).mockResolvedValue(1)
        vi.mocked(mockPrisma.comment.count).mockResolvedValue(1)
        vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([])
        vi.mocked(mockPrisma.comment.findMany).mockResolvedValue([])
      })

      it('should correctly detect capitalization ratio', async () => {
        const highCaps = 'THIS IS MOSTLY CAPS TEXT'
        const lowCaps = 'This is mostly lowercase text'

        const highCapsResult = await service.detectSpam({
          userId: 'user-123',
          content: highCaps,
          entityType: 'listing',
        })

        const lowCapsResult = await service.detectSpam({
          userId: 'user-123',
          content: lowCaps,
          entityType: 'listing',
        })

        expect(highCapsResult.isSpam).toBe(true)
        expect(lowCapsResult.isSpam).toBe(false)
      })

      it('should detect repeated character patterns', async () => {
        const withRepeats = 'Hellooooooo woooorld'
        const withoutRepeats = 'Hello world'

        const withRepeatsResult = await service.detectSpam({
          userId: 'user-123',
          content: withRepeats,
          entityType: 'listing',
        })

        const withoutRepeatsResult = await service.detectSpam({
          userId: 'user-123',
          content: withoutRepeats,
          entityType: 'listing',
        })

        expect(withRepeatsResult.isSpam).toBe(true)
        expect(withoutRepeatsResult.isSpam).toBe(false)
      })

      it('should detect URL patterns', async () => {
        const withSuspiciousUrl = 'Check out this link bit.ly/test'
        const withLegitUrl = 'Visit our website example.com'

        const suspiciousResult = await service.detectSpam({
          userId: 'user-123',
          content: withSuspiciousUrl,
          entityType: 'listing',
        })

        const legitResult = await service.detectSpam({
          userId: 'user-123',
          content: withLegitUrl,
          entityType: 'listing',
        })

        expect(suspiciousResult.isSpam).toBe(true)
        expect(legitResult.isSpam).toBe(false)
      })
    })

    describe('Advanced Pattern Detection', () => {
      beforeEach(() => {
        vi.mocked(mockPrisma.listing.count).mockResolvedValue(1)
        vi.mocked(mockPrisma.comment.count).mockResolvedValue(1)
        vi.mocked(mockPrisma.listing.findMany).mockResolvedValue([])
        vi.mocked(mockPrisma.comment.findMany).mockResolvedValue([])
      })

      it('should detect modern crypto scam patterns', async () => {
        const cryptoScams = [
          'Free NFT airdrop! Claim your tokens now',
          'Join our exclusive Discord for 100x gains',
          'Connect wallet to verify ownership',
          'DM me for whitelist spot',
        ]

        for (const scam of cryptoScams) {
          const result = await service.detectSpam({
            userId: 'user-123',
            content: scam,
            entityType: 'comment',
          })
          expect(result.isSpam).toBe(true)
          expect(result.method).toBe('pattern_matching')
        }
      })

      it('should detect suspicious TLDs', async () => {
        const result = await service.detectSpam({
          userId: 'user-123',
          content: 'Check out this site example.xyz for amazing deals',
          entityType: 'comment',
        })

        expect(result.isSpam).toBe(true)
        expect(result.method).toBe('pattern_matching')
      })

      it('should detect leetspeak obfuscation', async () => {
        const result = await service.detectSpam({
          userId: 'user-123',
          content: 'Fr33 b1tc0!n w1n c@$h pr1z3',
          entityType: 'comment',
        })

        expect(result.isSpam).toBe(true)
        expect(result.method).toBe('pattern_matching')
      })

      it('should detect excessive URLs', async () => {
        const result = await service.detectSpam({
          userId: 'user-123',
          content:
            'Check these links: https://example1.com https://example2.com https://example3.com https://example4.com',
          entityType: 'comment',
        })

        expect(result.isSpam).toBe(true)
        expect(result.method).toBe('pattern_matching')
      })

      it('should allow legitimate game discussion', async () => {
        const legitContent = [
          'This emulator runs Pokemon really well on my device',
          'Great performance with RetroArch on Steam Deck',
          'You can download the latest version from the official site',
        ]

        for (const content of legitContent) {
          const result = await service.detectSpam({
            userId: 'user-123',
            content,
            entityType: 'listing',
          })
          expect(result.isSpam).toBe(false)
        }
      })

      it('should handle combined spam signals', async () => {
        const result = await service.detectSpam({
          userId: 'user-123',
          content: 'FREE AIRDROP!!! bit.ly/crypto claim your tokens DM me now!!!',
          entityType: 'comment',
        })

        expect(result.isSpam).toBe(true)
        expect(result.confidence).toBeGreaterThan(0.9)
        expect(result.method).toBe('content_analysis')
      })
    })
  })
})
