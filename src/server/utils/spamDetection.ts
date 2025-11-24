import { type PrismaClient } from '@orm'

export interface SpamDetectionResult {
  isSpam: boolean
  confidence: number
  method: 'content_analysis' | 'rate_limiting' | 'pattern_matching' | 'duplicate_detection'
  reason?: string
}

export interface SpamDetectionConfig {
  enableRateLimiting?: boolean
  enableContentAnalysis?: boolean
  enableDuplicateDetection?: boolean
  enablePatternMatching?: boolean
  rateLimitWindow?: number // minutes
  rateLimitMax?: number // max items per window
}

const SPAM_DETECTION_THRESHOLDS = {
  CAPS_RATIO: 0.5,
  MIN_CONTENT_LENGTH: 20,
  PUNCTUATION_MIN_MATCHES: 2,
  REPEATED_CHAR_MIN_LENGTH: 4,
  EMOJI_MAX_COUNT: 10,
  SPAM_SCORE_THRESHOLD: 0.7,
  DUPLICATE_SIMILARITY_THRESHOLD: 0.9,
  DUPLICATE_MIN_COUNT: 2,
  DUPLICATE_TIME_WINDOW_HOURS: 24,
  SPAM_SCORE_HIGH: 0.75,
  SPAM_SCORE_MEDIUM: 0.5,
  MAX_CONFIDENCE: 0.99,
  MAX_CONTENT_LENGTH: 10000,
  MAX_RECENT_ITEMS_TO_CHECK: 100,
} as const

const DEFAULT_CONFIG: Required<SpamDetectionConfig> = {
  enableRateLimiting: true,
  enableContentAnalysis: true,
  enableDuplicateDetection: true,
  enablePatternMatching: true,
  rateLimitWindow: 5,
  rateLimitMax: 3,
}

/**
 * Comprehensive spam detection service
 * Checks content for spam using multiple detection methods
 */
export class SpamDetectionService {
  constructor(
    private prisma: PrismaClient,
    private config: SpamDetectionConfig = DEFAULT_CONFIG,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Check if content is spam using all enabled detection methods
   * Gracefully degrades on database errors by falling back to content analysis
   */
  async detectSpam(params: {
    userId: string
    content: string
    entityType: 'listing' | 'comment'
  }): Promise<SpamDetectionResult> {
    const { userId, entityType } = params
    let { content } = params

    if (content.length > SPAM_DETECTION_THRESHOLDS.MAX_CONTENT_LENGTH) {
      content = content.substring(0, SPAM_DETECTION_THRESHOLDS.MAX_CONTENT_LENGTH)
    }

    try {
      if (this.config.enableRateLimiting) {
        const rateLimitResult = await this.checkRateLimit(userId, entityType)
        if (rateLimitResult.isSpam) return rateLimitResult
      }
    } catch (error) {
      console.error('Rate limit check failed, continuing with other checks:', error)
    }

    try {
      if (this.config.enableDuplicateDetection) {
        const duplicateResult = await this.checkDuplicateContent(userId, content, entityType)
        if (duplicateResult.isSpam) return duplicateResult
      }
    } catch (error) {
      console.error('Duplicate detection failed, continuing with other checks:', error)
    }

    try {
      if (this.config.enableContentAnalysis) {
        const contentResult = this.analyzeContent(content)
        if (contentResult.isSpam) return contentResult
      }
    } catch (error) {
      console.error('Content analysis failed, continuing with other checks:', error)
    }

    try {
      if (this.config.enablePatternMatching) {
        const patternResult = this.checkSpamPatterns(content)
        if (patternResult.isSpam) return patternResult
      }
    } catch (error) {
      console.error('Pattern matching failed:', error)
    }

    return { isSpam: false, confidence: 0, method: 'content_analysis' }
  }

  /**
   * Check if user is posting too frequently
   */
  private async checkRateLimit(
    userId: string,
    entityType: 'listing' | 'comment',
  ): Promise<SpamDetectionResult> {
    const windowStart = new Date(Date.now() - this.config.rateLimitWindow! * 60 * 1000)

    let count = 0
    if (entityType === 'listing') {
      count = await this.prisma.listing.count({
        where: {
          authorId: userId,
          createdAt: { gte: windowStart },
        },
      })
    } else {
      count = await this.prisma.comment.count({
        where: {
          userId,
          createdAt: { gte: windowStart },
        },
      })
    }

    if (count >= this.config.rateLimitMax!) {
      return {
        isSpam: true,
        confidence: 0.95,
        method: 'rate_limiting',
        reason: `Exceeded rate limit: ${count} ${entityType}s in ${this.config.rateLimitWindow} minutes`,
      }
    }

    return { isSpam: false, confidence: 0, method: 'rate_limiting' }
  }

  /**
   * Check for duplicate or very similar content
   */
  private async checkDuplicateContent(
    userId: string,
    content: string,
    entityType: 'listing' | 'comment',
  ): Promise<SpamDetectionResult> {
    const recentTimeWindow = new Date(
      Date.now() - SPAM_DETECTION_THRESHOLDS.DUPLICATE_TIME_WINDOW_HOURS * 60 * 60 * 1000,
    )
    const normalizedContent = this.normalizeContent(content)

    let duplicates = 0
    if (entityType === 'listing') {
      const recentListings = await this.prisma.listing.findMany({
        where: {
          authorId: userId,
          createdAt: { gte: recentTimeWindow },
          notes: { not: null },
        },
        select: { notes: true },
        take: SPAM_DETECTION_THRESHOLDS.MAX_RECENT_ITEMS_TO_CHECK,
        orderBy: { createdAt: 'desc' },
      })

      duplicates = recentListings.filter((listing) => {
        if (!listing.notes) return false
        const normalized = this.normalizeContent(listing.notes)
        return (
          this.calculateSimilarity(normalizedContent, normalized) >
          SPAM_DETECTION_THRESHOLDS.DUPLICATE_SIMILARITY_THRESHOLD
        )
      }).length
    } else {
      const recentComments = await this.prisma.comment.findMany({
        where: {
          userId,
          createdAt: { gte: recentTimeWindow },
        },
        select: { content: true },
        take: SPAM_DETECTION_THRESHOLDS.MAX_RECENT_ITEMS_TO_CHECK,
        orderBy: { createdAt: 'desc' },
      })

      duplicates = recentComments.filter((comment) => {
        const normalized = this.normalizeContent(comment.content)
        return (
          this.calculateSimilarity(normalizedContent, normalized) >
          SPAM_DETECTION_THRESHOLDS.DUPLICATE_SIMILARITY_THRESHOLD
        )
      }).length
    }

    if (duplicates >= SPAM_DETECTION_THRESHOLDS.DUPLICATE_MIN_COUNT) {
      return {
        isSpam: true,
        confidence: 0.9,
        method: 'duplicate_detection',
        reason: `Found ${duplicates} very similar ${entityType}s in the last ${SPAM_DETECTION_THRESHOLDS.DUPLICATE_TIME_WINDOW_HOURS} hours`,
      }
    }

    return { isSpam: false, confidence: 0, method: 'duplicate_detection' }
  }

  /**
   * Analyze content for spam characteristics
   */
  private analyzeContent(content: string): SpamDetectionResult {
    let spamScore = 0
    const reasons: string[] = []

    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (
      upperCaseRatio > SPAM_DETECTION_THRESHOLDS.CAPS_RATIO &&
      content.length > SPAM_DETECTION_THRESHOLDS.MIN_CONTENT_LENGTH
    ) {
      spamScore += SPAM_DETECTION_THRESHOLDS.SPAM_SCORE_HIGH
      reasons.push('excessive capitalization')
    }

    const punctuationMatches = content.match(/[!?]{2,}/g)
    if (
      punctuationMatches &&
      punctuationMatches.length >= SPAM_DETECTION_THRESHOLDS.PUNCTUATION_MIN_MATCHES
    ) {
      spamScore += SPAM_DETECTION_THRESHOLDS.SPAM_SCORE_HIGH
      reasons.push('excessive punctuation')
    }

    const repeatedCharsRegex = new RegExp(
      `(.)\\1{${SPAM_DETECTION_THRESHOLDS.REPEATED_CHAR_MIN_LENGTH},}`,
      'g',
    )
    const repeatedChars = content.match(repeatedCharsRegex)
    if (repeatedChars && repeatedChars.length > 0) {
      spamScore += SPAM_DETECTION_THRESHOLDS.SPAM_SCORE_HIGH
      reasons.push('repeated characters')
    }

    const suspiciousUrls = content.match(
      /\b(bit\.ly|tinyurl|goo\.gl|shortened|redirect|click-here)\b/gi,
    )
    if (suspiciousUrls && suspiciousUrls.length > 0) {
      spamScore += SPAM_DETECTION_THRESHOLDS.SPAM_SCORE_HIGH
      reasons.push('suspicious shortened URLs')
    }

    const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length
    if (emojiCount > SPAM_DETECTION_THRESHOLDS.EMOJI_MAX_COUNT) {
      spamScore += SPAM_DETECTION_THRESHOLDS.SPAM_SCORE_HIGH
      reasons.push('excessive emoji usage')
    }

    if (spamScore >= SPAM_DETECTION_THRESHOLDS.SPAM_SCORE_THRESHOLD) {
      return {
        isSpam: true,
        confidence: Math.min(spamScore, SPAM_DETECTION_THRESHOLDS.MAX_CONFIDENCE),
        method: 'content_analysis',
        reason: `Spam characteristics detected: ${reasons.join(', ')}`,
      }
    }

    return { isSpam: false, confidence: 0, method: 'content_analysis' }
  }

  /**
   * Check for known spam patterns
   */
  private checkSpamPatterns(content: string): SpamDetectionResult {
    const spamPatterns = [
      /\b(click here|buy now|limited time|act now|free money|get rich|work from home)\b/gi,
      /\b(viagra|cialis|casino|poker|lottery)\b/gi,
      /\b(congratulations! you['']?ve won|you are a winner)\b/gi,
      /\b(cheap (meds|pills|drugs)|online pharmacy)\b/gi,
      /\b(mlm|multi-level marketing|pyramid scheme)\b/gi,
    ]

    for (const pattern of spamPatterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        return {
          isSpam: true,
          confidence: 0.85,
          method: 'pattern_matching',
          reason: `Matched known spam pattern: ${matches[0]}`,
        }
      }
    }

    return { isSpam: false, confidence: 0, method: 'pattern_matching' }
  }

  /**
   * Normalize content for comparison
   * Exposed publicly for testing
   */
  normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Calculate similarity between two strings using frequency-aware Jaccard similarity
   * Accounts for word frequency to prevent "spam spam spam" = "spam"
   * Exposed publicly for testing
   */
  calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ').filter((w) => w.length > 0)
    const words2 = str2.split(' ').filter((w) => w.length > 0)

    if (words1.length === 0 && words2.length === 0) return 1.0
    if (words1.length === 0 || words2.length === 0) return 0.0

    const freq1 = new Map<string, number>()
    const freq2 = new Map<string, number>()

    for (const word of words1) {
      freq1.set(word, (freq1.get(word) || 0) + 1)
    }

    for (const word of words2) {
      freq2.set(word, (freq2.get(word) || 0) + 1)
    }

    const allWords = new Set([...freq1.keys(), ...freq2.keys()])
    let intersectionSize = 0
    let unionSize = 0

    for (const word of allWords) {
      const count1 = freq1.get(word) || 0
      const count2 = freq2.get(word) || 0
      intersectionSize += Math.min(count1, count2)
      unionSize += Math.max(count1, count2)
    }

    return intersectionSize / unionSize
  }
}
