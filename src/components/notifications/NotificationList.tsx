'use client'

import { Bell, Check, Trash2, Loader2 } from 'lucide-react'
import { LocalizedDate } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { RouterOutput } from '@/types/trpc'

type Notification = RouterOutput['notifications']['get']['notifications'][number]

interface Props {
  notifications: Notification[]
  isLoading: boolean
  isPending: boolean
  error: { message: string } | null
  onNotificationClick: (notification: Notification) => void
  onMarkAsRead: (notificationId: string) => void
  onDelete: (notificationId: string) => void
}

function NotificationList(props: Props) {
  if (props.isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (props.error) {
    return (
      <div className="p-4 text-center text-red-600 dark:text-red-400">
        Failed to load notifications: {props.error.message}
      </div>
    )
  }

  if (props.notifications.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No notifications yet</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {props.notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => props.onNotificationClick(notification)}
          className={cn(
            'p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
            !notification.isRead && 'bg-blue-50 dark:bg-blue-900/20',
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
                  <LocalizedDate date={notification.createdAt} format="date" />
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                  {notification.category}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.isRead && (
                <button
                  onClick={(ev) => {
                    ev.stopPropagation()
                    props.onMarkAsRead(notification.id)
                  }}
                  disabled={props.isLoading}
                  className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  aria-label="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(ev) => {
                  ev.stopPropagation()
                  props.onDelete(notification.id)
                }}
                disabled={props.isLoading}
                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default NotificationList
