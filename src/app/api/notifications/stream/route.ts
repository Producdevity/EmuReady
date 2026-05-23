import { auth } from '@clerk/nextjs/server'
import { connection, type NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import {
  realtimeNotificationService,
  createSSEResponse,
} from '@/server/notifications/realtimeService'

export async function GET(request: NextRequest) {
  await connection()

  try {
    const { userId } = await auth()

    if (!userId) return new Response('Unauthorized', { status: 401 })

    const stream = realtimeNotificationService.createSSEConnection(userId)
    const origin = request.headers.get('origin') || undefined

    return createSSEResponse(stream, origin)
  } catch (error) {
    logger.error('SSE connection error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
