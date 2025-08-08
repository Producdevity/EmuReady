'use client'

import { motion } from 'framer-motion'
import { Bell, Filter, Trash2, Check, Settings, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Pagination, LocalizedDate } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import getErrorMessage from '@/utils/getErrorMessage'
import { NotificationCategory } from '@orm'

const CATEGORIES = [
  { value: 'all', label: 'All', color: 'bg-gray-500' },
  {
    value: NotificationCategory.ENGAGEMENT,
    label: 'Engagement',
    color: 'bg-blue-500',
  },
  {
    value: NotificationCategory.CONTENT,
    label: 'Content',
    color: 'bg-green-500',
  },
  {
    value: NotificationCategory.SYSTEM,
    label: 'System',
    color: 'bg-yellow-500',
  },
  {
    value: NotificationCategory.MODERATION,
    label: 'Moderation',
    color: 'bg-red-500',
  },
] as const

function NotificationsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())

  const limit = 20
  const offset = (page - 1) * limit

  const utils = api.useUtils()

  const notificationsQuery = api.notifications.get.useQuery({
    limit,
    offset,
    category: selectedCategory === 'all' ? undefined : (selectedCategory as NotificationCategory),
  })

  // Fetch stats
  const statsQuery = api.notifications.getNotificationStats.useQuery()

  // Mutations
  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onSuccess: async () => {
      await invalidateQueries()
      setSelectedNotifications(new Set())
    },
    onError: (error) => {
      toast.error(`Failed to mark as read: ${getErrorMessage(error)}`)
    },
  })

  const markAllAsReadMutation = api.notifications.markAllAsRead.useMutation({
    onSuccess: async () => {
      await invalidateQueries()
      setSelectedNotifications(new Set())
      toast.success('All notifications marked as read')
    },
    onError: (error) => {
      toast.error(`Failed to mark all as read: ${getErrorMessage(error)}`)
    },
  })

  const deleteMutation = api.notifications.delete.useMutation({
    onSuccess: async () => {
      await invalidateQueries()
      setSelectedNotifications(new Set())
      toast.success('Notifications deleted')
    },
    onError: (error) => {
      toast.error(`Failed to delete notifications: ${getErrorMessage(error)}`)
    },
  })

  const invalidateQueries = async () => {
    await utils.notifications.get.invalidate()
    await utils.notifications.getNotificationStats.invalidate()
    await utils.notifications.getUnreadCount.invalidate()
  }

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsReadMutation.mutateAsync({ notificationId })
  }

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.size === 0) return

    for (const notificationId of selectedNotifications) {
      await markAsReadMutation.mutateAsync({ notificationId })
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) return

    for (const notificationId of selectedNotifications) {
      await deleteMutation.mutateAsync({ notificationId })
    }
  }

  const handleSelectAll = () => {
    const notifications = notificationsQuery.data?.notifications || []
    const newSelectedNotifications =
      selectedNotifications.size === notifications.length
        ? new Set<string>()
        : new Set<string>(notifications.map((n) => n.id))
    setSelectedNotifications(newSelectedNotifications)
  }

  const handleSelectNotification = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications)
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId)
    } else {
      newSelected.add(notificationId)
    }
    setSelectedNotifications(newSelected)
  }

  const handleNotificationClick = (notification: {
    id: string
    isRead: boolean
    actionUrl?: string | null
  }) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id).catch(console.error)
    }

    if (notification.actionUrl) router.push(notification.actionUrl)
  }

  const notifications = notificationsQuery.data?.notifications || []
  const pagination = notificationsQuery.data?.pagination
  const stats = statsQuery.data

  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your notifications and preferences
            </p>
          </div>
          <div className="flex items-center gap-4">
            {stats && (
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.unread}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Unread</div>
              </div>
            )}
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CATEGORIES.map((category) => (
              <motion.div
                key={category.value}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-3 h-3 rounded-full', category.color)} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.byCategory[category.value] || 0}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-full sm:w-64"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setPage(1)
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            {selectedNotifications.size > 0 && (
              <>
                <button
                  onClick={handleMarkSelectedAsRead}
                  disabled={markAsReadMutation.isPending}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Check className="w-4 h-4" />
                  Mark Read ({selectedNotifications.size})
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedNotifications.size})
                </button>
              </>
            )}
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Check className="w-4 h-4" />
              Mark All Read
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {notificationsQuery.isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
              </div>
            </div>
          ) : notificationsQuery.error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400">
                Failed to load notifications: {getErrorMessage(notificationsQuery.error)}
              </p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No notifications found</p>
            </div>
          ) : (
            <>
              {/* Select All Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      selectedNotifications.size === filteredNotifications.length &&
                      filteredNotifications.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Select all ({filteredNotifications.length})
                  </span>
                </label>
              </div>

              {/* Notifications */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                      !notification.isRead && 'bg-blue-50 dark:bg-blue-900/20',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.has(notification.id)}
                        onChange={() => handleSelectNotification(notification.id)}
                        className="mt-1 rounded border-gray-300 dark:border-gray-600"
                      />
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                          <span
                            className={cn(
                              'text-xs px-2 py-1 rounded',
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
                            )}
                          >
                            {notification.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            <LocalizedDate date={notification.createdAt} format="dateTime" />
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              void handleMarkAsRead(notification.id)
                            }}
                            disabled={markAsReadMutation.isPending}
                            className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation()
                            deleteMutation.mutate({
                              notificationId: notification.id,
                            })
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination && Math.ceil(pagination.total / pagination.limit) > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(pagination.total / pagination.limit)}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default NotificationsPage
