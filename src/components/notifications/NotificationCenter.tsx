'use client'

import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { POLLING_INTERVALS } from '@/data/constants'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import getErrorMessage from '@/utils/getErrorMessage'
import NotificationList from './NotificationList'

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
    { enabled: !!user, refetchInterval: POLLING_INTERVALS.NOTIFICATIONS },
  )
  const unreadCountQuery = api.notifications.getUnreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: POLLING_INTERVALS.NOTIFICATIONS,
  })

  // Mutations
  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onMutate: () => setIsLoading(true),
    onSuccess: () => {
      void invalidateNotifications()
      toast.success('Notification marked as read')
    },
    onError: (error) => {
      toast.error(`Failed to mark as read: ${getErrorMessage(error)}`)
    },
    onSettled: () => setIsLoading(false),
  })

  const markAllAsReadMutation = api.notifications.markAllAsRead.useMutation({
    onMutate: () => setIsLoading(true),
    onSuccess: () => {
      void invalidateNotifications()
      toast.success('All notifications marked as read')
    },
    onError: (error) => {
      toast.error(`Failed to mark all as read: ${getErrorMessage(error)}`)
    },
    onSettled: () => setIsLoading(false),
  })

  const deleteMutation = api.notifications.delete.useMutation({
    onMutate: () => setIsLoading(true),
    onSuccess: () => {
      void invalidateNotifications()
      toast.success('Notification deleted')
    },
    onError: (error) => {
      toast.error(`Failed to delete notification: ${getErrorMessage(error)}`)
    },
    onSettled: () => setIsLoading(false),
  })

  const invalidateNotifications = async () => {
    await utils.notifications.get.invalidate()
    await utils.notifications.getUnreadCount.invalidate()
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
      markAsReadMutation.mutateAsync({ notificationId: notification.id }).catch(console.error)
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

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutateAsync({ notificationId }).catch(console.error)
  }

  const handleDelete = (notificationId: string) => {
    deleteMutation.mutateAsync({ notificationId }).catch(console.error)
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
        onClick={(ev) => {
          ev.stopPropagation()
          setIsOpen(!isOpen)
        }}
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

      {/* Desktop Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="desktop-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden"
            onClick={(ev) => ev.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutateAsync()}
                    disabled={isLoading}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-72 overflow-y-auto">
              <NotificationList
                notifications={notifications}
                isLoading={isLoading}
                isPending={notificationsQuery.isPending}
                error={notificationsQuery.error}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            </div>

            {/* Footer */}
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

      {/* Mobile Bottom Sheet */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence mode="wait">
            {isOpen && (
              <>
                {/* Backdrop for mobile */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleBackdropClick}
                  className="fixed inset-0 z-40 bg-black/30 md:hidden"
                  aria-hidden="true"
                />

                {/* Bottom Sheet */}
                <motion.div
                  initial={{ translateY: '100%' }}
                  animate={{ translateY: 0 }}
                  exit={{ translateY: '100%' }}
                  transition={{
                    type: 'spring',
                    damping: 40,
                    stiffness: 400,
                  }}
                  className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] max-h-[85vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:hidden dark:bg-gray-800"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  {/* Handle Bar */}
                  <div className="flex flex-shrink-0 justify-center pb-2 pt-3">
                    <div className="h-1 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                  </div>

                  {/* Header */}
                  <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsReadMutation.mutateAsync()}
                          disabled={isLoading}
                          className="text-sm text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Close notifications"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <NotificationList
                      notifications={notifications}
                      isLoading={isLoading}
                      isPending={notificationsQuery.isPending}
                      error={notificationsQuery.error}
                      onNotificationClick={handleNotificationClick}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                    />
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="flex-shrink-0 border-t border-gray-200 p-4 pb-safe dark:border-gray-700">
                      <button
                        onClick={handleViewAllNotifications}
                        className="w-full rounded-lg py-3 px-4 text-center text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Desktop Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-40 hidden bg-transparent md:block"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationCenter
