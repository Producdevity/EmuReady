import { auth } from '@clerk/nextjs/server'
import {
  realtimeNotificationService,
  createSSEResponse,
} from '@/server/notifications/realtimeService'

export async function GET() {
  try {
    // Get authenticated user
    const { userId } = await auth()

    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Create SSE stream for the user
    const stream = realtimeNotificationService.createSSEConnection(userId)

    return createSSEResponse(stream)
  } catch (error) {
    console.error('SSE connection error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
