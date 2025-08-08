import { getAllowedOrigins } from '@/lib/cors'

interface SSEConnection {
  userId: string
  controller: ReadableStreamDefaultController
  lastPing: number
}

class RealtimeNotificationService {
  private connections = new Map<string, SSEConnection>()
  private pingInterval: NodeJS.Timeout | null = null

  // Connection limits
  private readonly MAX_CONNECTIONS = 1000 // Maximum total connections
  private readonly MAX_CONNECTIONS_PER_IP = 10 // Maximum connections per IP
  private connectionsByIp = new Map<string, Set<string>>() // IP -> Set of userIds

  constructor() {
    this.startPingInterval()
  }

  // Create SSE connection for a user
  createSSEConnection(userId: string, clientIp?: string): ReadableStream {
    // Check total connection limit
    if (this.connections.size >= this.MAX_CONNECTIONS) {
      throw new Error('Server connection limit reached')
    }

    // Check per-IP connection limit if IP is provided
    if (clientIp) {
      const ipConnections = this.connectionsByIp.get(clientIp) || new Set()
      if (ipConnections.size >= this.MAX_CONNECTIONS_PER_IP) {
        throw new Error('Connection limit exceeded for this IP')
      }
    }

    return new ReadableStream({
      start: (controller) => {
        // Close existing connection for this user if any
        if (this.connections.has(userId)) {
          const existing = this.connections.get(userId)
          existing?.controller.close()
          this.connections.delete(userId)
        }

        // Store connection
        this.connections.set(userId, {
          userId,
          controller,
          lastPing: Date.now(),
        })

        // Track IP connection if provided
        if (clientIp) {
          const ipConnections = this.connectionsByIp.get(clientIp) || new Set()
          ipConnections.add(userId)
          this.connectionsByIp.set(clientIp, ipConnections)
        }

        // Send initial connection message
        this.sendToUser(userId, {
          type: 'connected',
          data: { message: 'Connected to notification stream' },
        })

        console.log(`SSE connection established for user: ${userId}`)
      },
      cancel: () => {
        this.connections.delete(userId)

        // Clean up IP tracking
        if (clientIp) {
          const ipConnections = this.connectionsByIp.get(clientIp)
          if (ipConnections) {
            ipConnections.delete(userId)
            if (ipConnections.size === 0) {
              this.connectionsByIp.delete(clientIp)
            }
          }
        }

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
  private sendToUser(userId: string, message: { type: string; data: unknown }): boolean {
    const connection = this.connections.get(userId)
    if (!connection) return false

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
    this.connectionsByIp.clear()
  }
}

// Singleton instance
export const realtimeNotificationService = new RealtimeNotificationService()

/**
 * Helper function to create SSE response with proper CORS
 * @param stream
 * @param origin
 */
export function createSSEResponse(stream: ReadableStream, origin?: string): Response {
  // Use centralized CORS configuration
  const allowedOrigins = getAllowedOrigins()

  // Allow mobile apps (no origin) or explicitly allowed origins
  const allowOrigin = !origin
    ? '*' // No origin header (mobile apps)
    : allowedOrigins.length === 0
      ? '*' // No origins configured (dev mode)
      : allowedOrigins.includes(origin)
        ? origin // Origin is allowed
        : allowedOrigins[0] || '*' // Fallback to first allowed origin

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
