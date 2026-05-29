import {
  getRequestIp,
  isTurnstileConfigured,
  verifyTurnstileToken,
} from '@/features/human-verification/server/providers/turnstile'
import { HUMAN_VERIFICATION_TOKEN_MAX_LENGTH } from '@/features/human-verification/shared/constants'
import analytics from '@/lib/analytics'
import { AppError } from '@/lib/errors'
import { SpamDetectionService, type SpamEntityType } from '@/server/utils/spamDetection'
import { type PrismaClient } from '@orm/client'

type SpamDecision = 'block' | 'challenge'

interface CheckSpamContentParams {
  prisma: PrismaClient
  userId: string
  content: string
  entityType: SpamEntityType
  challengeMode?: 'block' | 'challenge'
  humanVerificationToken?: string | null
  headers?: Headers
}

export async function checkSpamContent(params: CheckSpamContentParams): Promise<void> {
  const detector = new SpamDetectionService(params.prisma, {
    enableRateLimiting: process.env.DISABLE_RATE_LIMIT !== 'true',
  })
  const result = await detector.detectSpam({
    userId: params.userId,
    content: params.content,
    entityType: params.entityType,
  })

  if (!result.isSpam) return

  analytics.contentQuality.spamDetected({
    entityType: params.entityType,
    entityId: params.userId,
    confidence: result.confidence,
    method: result.method,
  })

  if (result.method === 'rate_limiting') {
    throw AppError.tooManyRequests(result.reason)
  }

  const decision = getSpamDecision(result.confidence)
  if (params.challengeMode === 'challenge' && decision === 'challenge') {
    await enforceHumanVerification(params.humanVerificationToken, params.headers)
    return
  }

  throw AppError.badRequest(
    `Spam detected: ${result.reason || 'Your content appears to be spam. Please review our community guidelines.'}`,
  )
}

function getSpamDecision(confidence: number): SpamDecision {
  return confidence >= 0.95 ? 'block' : 'challenge'
}

async function enforceHumanVerification(
  token: string | null | undefined,
  headers: Headers | undefined,
): Promise<void> {
  if (!isTurnstileConfigured()) AppError.humanVerificationUnavailable()

  if (!token) AppError.humanVerificationRequired()

  if (token.length > HUMAN_VERIFICATION_TOKEN_MAX_LENGTH) {
    AppError.humanVerificationFailed()
  }

  const result = await verifyTurnstileToken({
    token,
    remoteIp: getRequestIp(headers),
  })

  if (!result.success) AppError.humanVerificationFailed()
}
