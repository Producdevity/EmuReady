import { auth } from '@clerk/nextjs/server'
import { type NextRequest } from 'next/server'
import {
  realtimeNotificationService,
  createSSEResponse,
} from '@/server/notifications/realtimeService'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth()

    if (!userId) return new Response('Unauthorized', { status: 401 })

    // Create SSE stream for the user
    const stream = realtimeNotificationService.createSSEConnection(userId)

    // Pass origin for proper CORS handling
    const origin = request.headers.get('origin') || undefined

    return createSSEResponse(stream, origin)
  } catch (error) {
    console.error('SSE connection error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
