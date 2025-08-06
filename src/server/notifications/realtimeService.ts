interface SSEConnection {
  userId: string
  controller: ReadableStreamDefaultController
  lastPing: number
}

class RealtimeNotificationService {
  private connections = new Map<string, SSEConnection>()
  private pingInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startPingInterval()
  }

  // Create SSE connection for a user
  createSSEConnection(userId: string): ReadableStream {
    return new ReadableStream({
      start: (controller) => {
        // Store connection
        this.connections.set(userId, {
          userId,
          controller,
          lastPing: Date.now(),
        })

        // Send initial connection message
        this.sendToUser(userId, {
          type: 'connected',
          data: { message: 'Connected to notification stream' },
        })

        console.log(`SSE connection established for user: ${userId}`)
      },
      cancel: () => {
        this.connections.delete(userId)
        console.log(`SSE connection closed for user: ${userId}`)
      },
    })
  }

  // Send notification to specific user
  sendNotificationToUser(
    userId: string,
    notification: {
      id: string
      type: string
      title: string
      message: string
      actionUrl?: string
      createdAt: string
    },
  ): boolean {
    return this.sendToUser(userId, {
      type: 'notification',
      data: notification,
    })
  }

  // Send unread count update to user
  sendUnreadCountToUser(userId: string, count: number): boolean {
    return this.sendToUser(userId, {
      type: 'unread_count',
      data: { count },
    })
  }

  // Broadcast to all connected users
  broadcast(message: { type: string; data: unknown }): void {
    for (const [userId] of this.connections) {
      this.sendToUser(userId, message)
    }
  }

  // Send message to specific user
  private sendToUser(
    userId: string,
    message: { type: string; data: unknown },
  ): boolean {
    const connection = this.connections.get(userId)
    if (!connection) {
      return false
    }

    try {
      const sseData = `data: ${JSON.stringify(message)}\n\n`
      connection.controller.enqueue(new TextEncoder().encode(sseData))
      return true
    } catch (error) {
      console.error(`Failed to send SSE message to user ${userId}:`, error)
      this.connections.delete(userId)
      return false
    }
  }

  // Keep connections alive with periodic pings
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now()
      const staleConnections: string[] = []

      for (const [userId, connection] of this.connections) {
        // Send ping
        const pingSuccess = this.sendToUser(userId, {
          type: 'ping',
          data: { timestamp: now },
        })

        if (!pingSuccess || now - connection.lastPing > 60000) {
          // Connection failed or hasn't responded to ping in 60 seconds
          staleConnections.push(userId)
        } else {
          connection.lastPing = now
        }
      }

      // Clean up stale connections
      for (const userId of staleConnections) {
        this.connections.delete(userId)
        console.log(`Removed stale SSE connection for user: ${userId}`)
      }
    }, 30000) // Ping every 30 seconds
    // Let process exit if this is the only timer
    this.pingInterval.unref?.()
  }

  // Get connection status
  getConnectionStatus(): {
    totalConnections: number
    connectedUsers: string[]
  } {
    return {
      totalConnections: this.connections.size,
      connectedUsers: Array.from(this.connections.keys()),
    }
  }

  // Cleanup
  destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }

    // Close all connections
    for (const [userId, connection] of this.connections) {
      try {
        connection.controller.close()
      } catch (error) {
        console.error(`Error closing connection for user ${userId}:`, error)
      }
    }

    this.connections.clear()
  }
}

// Singleton instance
export const realtimeNotificationService = new RealtimeNotificationService()

// Helper function to create SSE response with proper CORS
export function createSSEResponse(
  stream: ReadableStream,
  origin?: string,
): Response {
  // Use same CORS logic as other endpoints
  const allowedOrigins =
    process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || []
  const allowOrigin =
    allowedOrigins.length === 0
      ? '*' // Backward compatibility
      : origin && allowedOrigins.includes(origin)
        ? origin
        : allowedOrigins[0] || '*'

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
