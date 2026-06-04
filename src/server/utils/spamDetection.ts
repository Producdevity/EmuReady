import { Role, type PrismaClient } from '@orm/client'

export interface SpamDetectionResult {
  isSpam: boolean
  confidence: number
  method: 'content_analysis' | 'rate_limiting' | 'pattern_matching' | 'duplicate_detection'
  reason?: string
}

export type SpamEntityType = 'listing' | 'pcListing' | 'comment' | 'pcComment' | 'game'

type SpamEntityCategory = 'report' | 'comment' | 'game'

interface RateLimitRule {
  windowMinutes: number
  maxItems: number
}

interface UserRateLimitProfile {
  createdAt: Date
  role: Role
  trustScore: number
}

export interface SpamDetectionConfig {
  enableRateLimiting?: boolean
  enableContentAnalysis?: boolean
  enableDuplicateDetection?: boolean
  enablePatternMatching?: boolean
  rateLimitWindow?: number
  rateLimitMax?: number
  rateLimits?: Partial<Record<SpamEntityCategory, Partial<RateLimitRule>>>
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

const DEFAULT_RATE_LIMITS: Record<SpamEntityCategory, RateLimitRule> = {
  report: {
    windowMinutes: 15,
    maxItems: 5,
  },
  comment: {
    windowMinutes: 5,
    maxItems: 10,
  },
  game: {
    windowMinutes: 15,
    maxItems: 10,
  },
}

const REPORT_RATE_LIMIT_TIERS = {
  ESTABLISHED_ACCOUNT_DAYS: 30,
  CONTRIBUTOR_TRUST_SCORE: 100,
  TRUSTED_TRUST_SCORE: 250,
  ESTABLISHED_MAX_ITEMS: 20,
  TRUSTED_MAX_ITEMS: 40,
  STAFF_MAX_ITEMS: 100,
} as const

const STAFF_ROLES = new Set<Role>([Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN])

interface NormalizedSpamDetectionConfig {
  enableRateLimiting: boolean
  enableContentAnalysis: boolean
  enableDuplicateDetection: boolean
  enablePatternMatching: boolean
  rateLimitWindow?: number
  rateLimitMax?: number
  rateLimits: Record<SpamEntityCategory, RateLimitRule>
}

const DEFAULT_CONFIG: NormalizedSpamDetectionConfig = {
  enableRateLimiting: true,
  enableContentAnalysis: true,
  enableDuplicateDetection: true,
  enablePatternMatching: true,
  rateLimits: DEFAULT_RATE_LIMITS,
}

function getEntityCategory(entityType: SpamEntityType): SpamEntityCategory {
  if (entityType === 'listing' || entityType === 'pcListing') return 'report'
  if (entityType === 'game') return 'game'
  return 'comment'
}

function formatEntityCategory(category: SpamEntityCategory): string {
  if (category === 'report') return 'reports'
  if (category === 'game') return 'games'
  return 'comments'
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function getAccountAgeDays(createdAt: Date): number {
  return (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)
}

function getReportRateLimitMax(profile: UserRateLimitProfile): number {
  if (STAFF_ROLES.has(profile.role)) return REPORT_RATE_LIMIT_TIERS.STAFF_MAX_ITEMS
  if (profile.trustScore >= REPORT_RATE_LIMIT_TIERS.TRUSTED_TRUST_SCORE) {
    return REPORT_RATE_LIMIT_TIERS.TRUSTED_MAX_ITEMS
  }
  if (
    profile.trustScore >= REPORT_RATE_LIMIT_TIERS.CONTRIBUTOR_TRUST_SCORE ||
    getAccountAgeDays(profile.createdAt) >= REPORT_RATE_LIMIT_TIERS.ESTABLISHED_ACCOUNT_DAYS
  ) {
    return REPORT_RATE_LIMIT_TIERS.ESTABLISHED_MAX_ITEMS
  }

  return DEFAULT_RATE_LIMITS.report.maxItems
}

export class SpamDetectionService {
  private readonly config: NormalizedSpamDetectionConfig

  constructor(
    private prisma: PrismaClient,
    config: SpamDetectionConfig = {},
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      rateLimits: {
        report: {
          ...DEFAULT_CONFIG.rateLimits.report,
          ...config.rateLimits?.report,
        },
        comment: {
          ...DEFAULT_CONFIG.rateLimits.comment,
          ...config.rateLimits?.comment,
        },
        game: {
          ...DEFAULT_CONFIG.rateLimits.game,
          ...config.rateLimits?.game,
        },
      },
    }
  }

  async detectSpam(params: {
    userId: string
    content: string
    entityType: SpamEntityType
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

  private async checkRateLimit(
    userId: string,
    entityType: SpamEntityType,
  ): Promise<SpamDetectionResult> {
    const category = getEntityCategory(entityType)
    const rule = await this.getRateLimitRule(category, userId)
    const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000)

    const count = await this.countRecentContent(category, userId, windowStart)

    if (count >= rule.maxItems) {
      return {
        isSpam: true,
        confidence: 0.95,
        method: 'rate_limiting',
        reason: `Too many recent ${formatEntityCategory(category)}. Please wait and try again.`,
      }
    }

    return { isSpam: false, confidence: 0, method: 'rate_limiting' }
  }

  private async getRateLimitRule(
    category: SpamEntityCategory,
    userId: string,
  ): Promise<RateLimitRule> {
    const configured = this.config.rateLimits[category]
    const baseRule = {
      windowMinutes: this.config.rateLimitWindow ?? configured.windowMinutes,
      maxItems: this.config.rateLimitMax ?? configured.maxItems,
    }

    if (category !== 'report' || this.config.rateLimitMax !== undefined) return baseRule

    const profile = await this.getUserRateLimitProfile(userId)
    if (!profile) return baseRule

    return {
      ...baseRule,
      maxItems: Math.max(baseRule.maxItems, getReportRateLimitMax(profile)),
    }
  }

  private async getUserRateLimitProfile(userId: string): Promise<UserRateLimitProfile | null> {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, role: true, trustScore: true },
    })
  }

  private async countRecentContent(
    category: SpamEntityCategory,
    userId: string,
    windowStart: Date,
  ): Promise<number> {
    if (category === 'report') return await this.countRecentReports(userId, windowStart)
    if (category === 'game') return await this.countRecentGames(userId, windowStart)
    return await this.countRecentComments(userId, windowStart)
  }

  private async countRecentReports(userId: string, windowStart: Date): Promise<number> {
    const [handheldCount, pcCount] = await Promise.all([
      this.prisma.listing.count({
        where: {
          authorId: userId,
          createdAt: { gte: windowStart },
        },
      }),
      this.prisma.pcListing.count({
        where: {
          authorId: userId,
          createdAt: { gte: windowStart },
        },
      }),
    ])

    return handheldCount + pcCount
  }

  private async countRecentGames(userId: string, windowStart: Date): Promise<number> {
    return await this.prisma.game.count({
      where: {
        submittedBy: userId,
        submittedAt: { gte: windowStart },
      },
    })
  }

  private async countRecentComments(userId: string, windowStart: Date): Promise<number> {
    const [handheldCount, pcCount] = await Promise.all([
      this.prisma.comment.count({
        where: {
          userId,
          createdAt: { gte: windowStart },
        },
      }),
      this.prisma.pcListingComment.count({
        where: {
          userId,
          createdAt: { gte: windowStart },
        },
      }),
    ])

    return handheldCount + pcCount
  }

  private async checkDuplicateContent(
    userId: string,
    content: string,
    entityType: SpamEntityType,
  ): Promise<SpamDetectionResult> {
    const recentTimeWindow = new Date(
      Date.now() - SPAM_DETECTION_THRESHOLDS.DUPLICATE_TIME_WINDOW_HOURS * 60 * 60 * 1000,
    )
    const normalizedContent = this.normalizeContent(content)
    if (!normalizedContent) return { isSpam: false, confidence: 0, method: 'duplicate_detection' }

    const category = getEntityCategory(entityType)
    const recentContent = await this.getRecentContent(category, userId, recentTimeWindow)

    const duplicates = recentContent.filter((recent) => {
      const normalized = this.normalizeContent(recent)
      return (
        this.calculateSimilarity(normalizedContent, normalized) >
        SPAM_DETECTION_THRESHOLDS.DUPLICATE_SIMILARITY_THRESHOLD
      )
    }).length

    if (duplicates >= SPAM_DETECTION_THRESHOLDS.DUPLICATE_MIN_COUNT) {
      return {
        isSpam: true,
        confidence: 0.9,
        method: 'duplicate_detection',
        reason: `Found ${duplicates} very similar ${formatEntityCategory(category)} in the last ${SPAM_DETECTION_THRESHOLDS.DUPLICATE_TIME_WINDOW_HOURS} hours`,
      }
    }

    return { isSpam: false, confidence: 0, method: 'duplicate_detection' }
  }

  private async getRecentContent(
    category: SpamEntityCategory,
    userId: string,
    recentTimeWindow: Date,
  ): Promise<string[]> {
    if (category === 'report') return await this.getRecentReportContent(userId, recentTimeWindow)
    if (category === 'game') return await this.getRecentGameContent(userId, recentTimeWindow)
    return await this.getRecentCommentContent(userId, recentTimeWindow)
  }

  private async getRecentReportContent(userId: string, recentTimeWindow: Date): Promise<string[]> {
    const [recentListings, recentPcListings] = await Promise.all([
      this.prisma.listing.findMany({
        where: {
          authorId: userId,
          createdAt: { gte: recentTimeWindow },
          notes: { not: null },
        },
        select: { notes: true },
        take: SPAM_DETECTION_THRESHOLDS.MAX_RECENT_ITEMS_TO_CHECK,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pcListing.findMany({
        where: {
          authorId: userId,
          createdAt: { gte: recentTimeWindow },
          notes: { not: null },
        },
        select: { notes: true },
        take: SPAM_DETECTION_THRESHOLDS.MAX_RECENT_ITEMS_TO_CHECK,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return [...recentListings, ...recentPcListings]
      .map((entry) => entry.notes)
      .filter(isNonEmptyString)
  }

  private async getRecentGameContent(userId: string, recentTimeWindow: Date): Promise<string[]> {
    const recentGames = await this.prisma.game.findMany({
      where: {
        submittedBy: userId,
        submittedAt: { gte: recentTimeWindow },
      },
      select: { title: true },
      take: SPAM_DETECTION_THRESHOLDS.MAX_RECENT_ITEMS_TO_CHECK,
      orderBy: { submittedAt: 'desc' },
    })

    return recentGames.map((entry) => entry.title).filter(isNonEmptyString)
  }

  private async getRecentCommentContent(userId: string, recentTimeWindow: Date): Promise<string[]> {
    const [recentComments, recentPcComments] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          userId,
          createdAt: { gte: recentTimeWindow },
        },
        select: { content: true },
        take: SPAM_DETECTION_THRESHOLDS.MAX_RECENT_ITEMS_TO_CHECK,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pcListingComment.findMany({
        where: {
          userId,
          createdAt: { gte: recentTimeWindow },
        },
        select: { content: true },
        take: SPAM_DETECTION_THRESHOLDS.MAX_RECENT_ITEMS_TO_CHECK,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return [...recentComments, ...recentPcComments]
      .map((entry) => entry.content)
      .filter(isNonEmptyString)
  }

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

  private checkSpamPatterns(content: string): SpamDetectionResult {
    const normalizedContent = content.toLowerCase()
    let spamScore = 0
    const detectedPatterns: string[] = []

    const classicSpamPatterns = [
      /\b(click\s*here|buy\s*now|limited\s*time|act\s*now|free\s*money|get\s*rich|work\s*from\s*home)\b/gi,
      /\b(viagra|cialis)\b/gi,
      /\b((online\s*)?(casino|poker|lottery).*(bonus|jackpot|bet|wager|win\s+money|real\s+money)|(bonus|jackpot|bet|wager|win\s+money|real\s+money).*(casino|poker|lottery))\b/gi,
      /\b(congratulations!?\s*you'?ve\s*won|you\s*are\s*a\s*winner)\b/gi,
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

  normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

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
