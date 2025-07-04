'use client'

import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, Trash2, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, type MouseEvent } from 'react'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import getErrorMessage from '@/utils/getErrorMessage'

interface Props {
  className?: string
}

function NotificationCenter(props: Props) {
  const { user } = useUser()
  const utils = api.useUtils()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const notificationsQuery = api.notifications.get.useQuery(
    { limit: 10, offset: 0 },
    {
      enabled: !!user,
      refetchInterval: 30000,
    },
  )
  const unreadCountQuery = api.notifications.getUnreadCount.useQuery(
    undefined,
    {
      enabled: !!user,
      refetchInterval: 30000,
    },
  )

  // Mutations
  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onSuccess: () => {
      invalidateNotifications()
    },
    onError: (error) => {
      toast.error(`Failed to mark as read: ${getErrorMessage(error)}`)
    },
  })

  const markAllAsReadMutation = api.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      invalidateNotifications()
      toast.success('All notifications marked as read')
    },
    onError: (error) => {
      toast.error(`Failed to mark all as read: ${getErrorMessage(error)}`)
    },
  })

  const deleteMutation = api.notifications.delete.useMutation({
    onSuccess: () => {
      invalidateNotifications()
      toast.success('Notification deleted')
    },
    onError: (error) => {
      toast.error(`Failed to delete notification: ${getErrorMessage(error)}`)
    },
  })

  const invalidateNotifications = () => {
    utils.notifications.get.refetch().catch(console.error)
    utils.notifications.getUnreadCount.invalidate().catch(console.error)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    setIsLoading(true)
    try {
      await markAsReadMutation.mutateAsync({ notificationId })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsLoading(true)
    try {
      await markAllAsReadMutation.mutateAsync()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (notificationId: string) => {
    setIsLoading(true)
    try {
      await deleteMutation.mutateAsync({ notificationId })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewAllNotifications = () => {
    setIsOpen(false)
    router.push('/notifications')
  }

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    } else {
      document.removeEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Don't render anything if user is not authenticated
  if (!user) return null

  const handleNotificationClick = (notification: (typeof notifications)[0]) => {
    // Mark as read if not already read (swallow error if it fails)
    if (!notification.isRead) {
      handleMarkAsRead(notification.id).catch(console.error)
    }

    setIsOpen(false)

    // Navigate based on actionUrl if available
    if (notification.actionUrl) return router.push(notification.actionUrl)

    // Try to extract route from metadata if actionUrl is not available
    const metadata = notification.metadata as Record<string, unknown>
    if (typeof metadata?.listingId === 'string') {
      router.push(`/listings/${metadata.listingId}`)
    } else if (typeof metadata?.gameId === 'string') {
      router.push(`/games/${metadata.gameId}`)
    } else if (typeof metadata?.userId === 'string') {
      router.push(`/users/${metadata.userId}`)
    } else {
      // Default to notifications page if no specific route
      router.push('/notifications')
    }
  }

  const handleBackdropClick = (ev: MouseEvent) => {
    // Only close if the click is directly on the backdrop, not bubbling from child elements
    if (ev.target !== ev.currentTarget) return
    setIsOpen(false)
  }

  const unreadCount = unreadCountQuery.data || 0
  const notifications = notificationsQuery.data?.notifications || []

  return (
    <div className={cn('relative', props.className)}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        disabled={isLoading}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden"
            onClick={(ev) => ev.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isLoading}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-72 overflow-y-auto">
              {notificationsQuery.isPending ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : notificationsQuery.error ? (
                <div className="p-4 text-center text-red-600 dark:text-red-400">
                  Failed to load notifications:{' '}
                  {getErrorMessage(notificationsQuery.error)}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
                        !notification.isRead &&
                          'bg-blue-50 dark:bg-blue-900/20',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(
                                notification.createdAt,
                              ).toLocaleDateString()}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                              {notification.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id)
                              }}
                              disabled={isLoading}
                              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(notification.id)
                            }}
                            disabled={isLoading}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Always visible */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
                <button
                  onClick={handleViewAllNotifications}
                  className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium py-2 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-40"
        />
      )}
    </div>
  )
}

export default NotificationCenter
