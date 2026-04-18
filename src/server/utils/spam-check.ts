import analytics from '@/lib/analytics'
import { AppError } from '@/lib/errors'
import { SpamDetectionService } from '@/server/utils/spamDetection'
import { type PrismaClient } from '@orm'

type SpamEntityType = 'listing' | 'comment'

interface CheckSpamContentParams {
  prisma: PrismaClient
  userId: string
  content: string
  entityType: SpamEntityType
}

export async function checkSpamContent(params: CheckSpamContentParams): Promise<void> {
  const detector = new SpamDetectionService(params.prisma)
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

  throw AppError.badRequest(
    `Spam detected: ${result.reason || 'Your content appears to be spam. Please review our community guidelines.'}`,
  )
}
