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

    let count: number
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

    let duplicates: number
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
   * Check for known spam patterns using advanced detection techniques
   * Based on 2024-2025 spam research including crypto scams, unicode obfuscation, and modern tactics
   */
  private checkSpamPatterns(content: string): SpamDetectionResult {
    const normalizedContent = content.toLowerCase()
    let spamScore = 0
    const detectedPatterns: string[] = []

    const classicSpamPatterns = [
      /\b(click\s*here|buy\s*now|limited\s*time|act\s*now|free\s*money|get\s*rich|work\s*from\s*home)\b/gi,
      /\b(viagra|cialis|casino|poker|lottery)\b/gi,
      /\b(congratulations[!]?\s*you['']?ve\s*won|you\s*are\s*a\s*winner)\b/gi,
      /\b(cheap\s*(meds|pills|drugs)|online\s*pharmacy)\b/gi,
      /\b(mlm|multi[-\s]level\s*marketing|pyramid\s*scheme)\b/gi,
    ]

    const modernCryptoScamPatterns = [
      /\b(airdrop|free\s*(nft|crypto|eth|btc|tokens?))\b/gi,
      /\b(claim\s*your|exclusive\s*(offer|drop|mint))\b/gi,
      /\b(stealth\s*launch|presale\s*now|whitelist\s*spot)\b/gi,
      /\b(100x|moon|pump|lambo|wen\s*moon)\b/gi,
      /\b(connect\s*wallet|verify\s*wallet|wallet\s*verification)\b/gi,
      /\b(dm\s*me|check\s*dm|direct\s*message|telegram\s*me)\b/gi,
      /\b(investment\s*opportunity|guaranteed\s*returns?|passive\s*income)\b/gi,
      /\b(join\s*our\s*(discord|telegram)|private\s*group)\b/gi,
    ]

    const suspiciousTLDs = [
      /\.(xyz|top|work|click|link|loan|gdn|racing|download|stream|win|bid)\b/gi,
      /\.(gq|ml|ga|tk|cf)\b/gi,
    ]

    const shortenedUrlServices = [
      /\b(bit\.ly|tinyurl|goo\.gl|ow\.ly|short\.link|tiny\.cc|is\.gd)\b/gi,
      /\b(cutt\.ly|rebrand\.ly|t\.co|buff\.ly|clk\.sh)\b/gi,
    ]

    for (const pattern of classicSpamPatterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        spamScore += 0.75
        detectedPatterns.push(`classic spam: "${matches[0]}"`)
      }
    }

    for (const pattern of modernCryptoScamPatterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        spamScore += 0.8
        detectedPatterns.push(`crypto scam: "${matches[0]}"`)
      }
    }

    for (const pattern of suspiciousTLDs) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        spamScore += 0.7
        detectedPatterns.push(`suspicious TLD: "${matches[0]}"`)
      }
    }

    for (const pattern of shortenedUrlServices) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        spamScore += 0.75
        detectedPatterns.push(`shortened URL: "${matches[0]}"`)
      }
    }

    const leetSpeakScore = this.detectLeetspeakObfuscation(normalizedContent)
    if (leetSpeakScore > 0) {
      spamScore += leetSpeakScore
      detectedPatterns.push('character substitution/leetspeak')
    }

    const unicodeScore = this.detectUnicodeObfuscation(content)
    if (unicodeScore > 0) {
      spamScore += unicodeScore
      detectedPatterns.push('unicode obfuscation')
    }

    const urlCount = (content.match(/https?:\/\/[^\s]+/gi) || []).length
    if (urlCount >= 3) {
      spamScore += 0.4 * Math.min(urlCount - 2, 3)
      detectedPatterns.push(`excessive URLs (${urlCount})`)
    }

    if (spamScore >= 0.7) {
      return {
        isSpam: true,
        confidence: Math.min(spamScore, 0.99),
        method: 'pattern_matching',
        reason: `Spam patterns detected: ${detectedPatterns.join(', ')}`,
      }
    }

    return { isSpam: false, confidence: 0, method: 'pattern_matching' }
  }

  /**
   * Detect leetspeak and character substitution obfuscation
   * Common substitutions: a->@/4, e->3, i->1/!, o->0, s->$, t->7
   */
  private detectLeetspeakObfuscation(content: string): number {
    const leetspeakPatterns = [
      /\b[a-z]*[@4][a-z]*3[a-z]*[1!][a-z]*0[a-z]*\b/i,
      /\b[a-z]*[@4][a-z]*\$[a-z]*[1!][a-z]*\b/i,
      /\b(fr[e3][e3]|w[1!]n|c[a@4]$h|pr[1!]z[e3])\b/i,
      /\b(b[1!]tc[o0][1!]n|[e3]th[e3]r[e3]um|cr[y1]pt[o0])\b/i,
    ]

    let score = 0
    const substitutionCount = (content.match(/[@4$!]/g) || []).length
    const contentLength = content.replace(/\s/g, '').length

    if (substitutionCount >= 3 && substitutionCount / contentLength > 0.05) {
      score += 0.3
    }

    let patternMatches = 0
    for (const pattern of leetspeakPatterns) {
      if (pattern.test(content)) {
        patternMatches++
      }
    }

    if (patternMatches >= 2) {
      score += 0.7
    } else if (patternMatches === 1) {
      score += 0.4
    }

    return score
  }

  /**
   * Detect unicode homoglyphs and obfuscation attempts
   * Checks for mixed scripts and suspicious unicode ranges
   */
  private detectUnicodeObfuscation(content: string): number {
    let score = 0

    const cyrillicCount = (content.match(/[\u0400-\u04FF]/g) || []).length
    const greekCount = (content.match(/[\u0370-\u03FF]/g) || []).length
    const latinCount = (content.match(/[A-Za-z]/g) || []).length

    if (latinCount > 5 && (cyrillicCount > 0 || greekCount > 0)) {
      const mixedScriptRatio =
        (cyrillicCount + greekCount) / (latinCount + cyrillicCount + greekCount)
      if (mixedScriptRatio > 0.1 && mixedScriptRatio < 0.9) {
        score += 0.6
      }
    }

    const invisibleChars = (
      content.match(/[\u200B-\u200D\uFEFF\u00AD\u061C\u180E\u2060-\u2069]/g) || []
    ).length
    if (invisibleChars > 2) {
      score += 0.5
    }

    return score
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
