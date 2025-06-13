'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useRef, useState } from 'react'

interface RealtimeNotification {
  id: string
  type: string
  title: string
  message: string
  actionUrl?: string
  createdAt: string
}

interface SSEMessage {
  type: 'connected' | 'notification' | 'unread_count' | 'ping'
  data: unknown
}

interface UseRealtimeNotificationsReturn {
  isConnected: boolean
  notifications: RealtimeNotification[]
  unreadCount: number
  connect: () => void
  disconnect: () => void
  markAsRead: (notificationId: string) => void
  clearNotifications: () => void
}

export function useRealtimeNotifications(): UseRealtimeNotificationsReturn {
  const { user, isLoaded } = useUser()
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxReconnectAttempts = 5
  const reconnectAttempts = useRef(0)

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setIsConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (!user?.id || eventSourceRef.current) {
      return
    }

    try {
      const eventSource = new EventSource(`/api/notifications/stream`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('SSE connection opened')
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data)

          switch (message.type) {
            case 'connected':
              console.log('Connected to notification stream')
              break

            case 'notification':
              const notification = message.data as RealtimeNotification
              setNotifications((prev) => [notification, ...prev].slice(0, 50)) // Keep last 50

              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                  body: notification.message,
                  icon: '/favicon/favicon-32x32.png',
                  tag: notification.id,
                })
              }
              break

            case 'unread_count':
              setUnreadCount((message.data as { count: number }).count)
              break

            case 'ping':
              // Respond to ping to keep connection alive
              console.log('Received ping from server')
              break

            default:
              console.log('Unknown SSE message type:', message.type)
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = () => {
        console.error('SSE connection error')
        setIsConnected(false)

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000,
          ) // Exponential backoff, max 30s

          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`,
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            disconnect()
            connect()
          }, delay)
        } else {
          console.error('Max reconnection attempts reached')
        }
      }
    } catch (error) {
      console.error('Failed to create SSE connection:', error)
    }
  }, [user?.id, disconnect])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif,
      ),
    )
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Auto-connect when user is loaded
  useEffect(() => {
    if (isLoaded && user?.id) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [isLoaded, user?.id, connect, disconnect])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission)
      })
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    notifications,
    unreadCount,
    connect,
    disconnect,
    markAsRead,
    clearNotifications,
  }
}
