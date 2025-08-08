'use client'

import { Bell } from 'lucide-react'
import { AnimatedToggle } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { NotificationType } from '@orm'

const allTypes = [
  NotificationType.ACCOUNT_WARNING,
  NotificationType.COMMENT_REPLY,
  NotificationType.CONTENT_FLAGGED,
  NotificationType.EMULATOR_UPDATED,
  NotificationType.FEATURE_ANNOUNCEMENT,
  NotificationType.GAME_ADDED,
  NotificationType.LISTING_APPROVED,
  NotificationType.LISTING_COMMENT,
  NotificationType.LISTING_REJECTED,
  NotificationType.LISTING_VOTE_DOWN,
  NotificationType.LISTING_VOTE_UP,
  NotificationType.MAINTENANCE_NOTICE,
  NotificationType.NEW_DEVICE_LISTING,
  NotificationType.NEW_SOC_LISTING,
  NotificationType.POLICY_UPDATE,
  NotificationType.ROLE_CHANGED,
  NotificationType.USER_MENTION,
]

type NotificationPreferencesData = RouterOutput['notifications']['getPreferences']

interface Props {
  notificationPreferencesQuery: {
    data?: NotificationPreferencesData
    isPending: boolean
    error?: unknown
  }
}

function NotificationPreferences(props: Props) {
  const utils = api.useUtils()

  const updateNotificationPreference = api.notifications.updatePreference.useMutation({
    onSuccess: () => {
      utils.notifications.getPreferences.invalidate().catch(console.error)
      toast.success('Notification preference updated!')
    },
    onError: (error) => {
      console.error('Error updating notification preference:', error)
      toast.error(`Failed to update preference: ${getErrorMessage(error)}`)
    },
  })

  // Helper function to get preference value
  function getPreferenceValue(type: string, field: 'inAppEnabled' | 'emailEnabled'): boolean {
    if (type === 'general') {
      return allTypes.every(
        (notifType) =>
          props.notificationPreferencesQuery.data?.find((p) => p.type === notifType)?.[field] ??
          true,
      )
    }

    return props.notificationPreferencesQuery.data?.find((p) => p.type === type)?.[field] ?? true
  }

  // Helper function to update preference
  function updatePreference(type: string, field: 'inAppEnabled' | 'emailEnabled', value: boolean) {
    if (type !== 'general') {
      return updateNotificationPreference.mutate({
        type: type as NotificationType,
        [field]: value,
      })
    }
    allTypes.forEach((notifType) => {
      updateNotificationPreference.mutate({
        type: notifType as NotificationType,
        [field]: value,
      })
    })
  }

  if (props.notificationPreferencesQuery.isPending) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const notificationCategories = [
    {
      title: 'General',
      description: 'Enable or disable all notifications at once',
      items: [
        {
          key: 'general',
          label: 'All Notifications',
          description: 'Master toggle for all notification types',
        },
      ],
    },
    {
      title: 'Engagement',
      description: 'Notifications about interactions with your content',
      items: [
        {
          key: NotificationType.LISTING_COMMENT,
          label: 'Listing Comments',
          description: 'When someone comments on your listings',
        },
        {
          key: NotificationType.LISTING_VOTE_UP,
          label: 'Upvotes',
          description: 'When someone upvotes your listings',
        },
        {
          key: NotificationType.LISTING_VOTE_DOWN,
          label: 'Downvotes',
          description: 'When someone downvotes your listings',
        },
        {
          key: NotificationType.COMMENT_REPLY,
          label: 'Comment Replies',
          description: 'When someone replies to your comments',
        },
        {
          key: NotificationType.USER_MENTION,
          label: 'Mentions',
          description: 'When someone mentions you',
        },
      ],
    },
    {
      title: 'Content Updates',
      description: 'Notifications about new content',
      items: [
        {
          key: NotificationType.NEW_DEVICE_LISTING,
          label: 'New Device Listings',
          description: 'When new devices are added',
        },
        {
          key: NotificationType.NEW_SOC_LISTING,
          label: 'New SOC Listings',
          description: 'When new SOCs are added',
        },
        {
          key: NotificationType.GAME_ADDED,
          label: 'New Games',
          description: 'When new games are added',
        },
        {
          key: NotificationType.EMULATOR_UPDATED,
          label: 'Emulator Updates',
          description: 'When emulators are updated',
        },
      ],
    },
    {
      title: 'System Notifications',
      description: 'Important system and policy updates',
      items: [
        {
          key: NotificationType.MAINTENANCE_NOTICE,
          label: 'Maintenance',
          description: 'System maintenance notifications',
        },
        {
          key: NotificationType.FEATURE_ANNOUNCEMENT,
          label: 'Feature Announcements',
          description: 'New features and updates',
        },
        {
          key: NotificationType.POLICY_UPDATE,
          label: 'Policy Updates',
          description: 'Terms of service and policy changes',
        },
      ],
    },
    {
      title: 'Moderation',
      description: 'Notifications about content moderation',
      items: [
        {
          key: NotificationType.LISTING_APPROVED,
          label: 'Listing Approved',
          description: 'When your listings are approved',
        },
        {
          key: NotificationType.LISTING_REJECTED,
          label: 'Listing Rejected',
          description: 'When your listings are rejected',
        },
        {
          key: NotificationType.CONTENT_FLAGGED,
          label: 'Content Flagged',
          description: 'When your content is flagged',
        },
        {
          key: NotificationType.ACCOUNT_WARNING,
          label: 'Account Warnings',
          description: 'Account-related warnings',
        },
      ],
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Notification Preferences
        </h2>
      </div>

      <div className="space-y-8">
        {notificationCategories.map((category) => (
          <div key={category.title}>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {category.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
            </div>

            <div className="space-y-4">
              {category.items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <AnimatedToggle
                            checked={getPreferenceValue(item.key, 'inAppEnabled')}
                            onChange={(checked) =>
                              updatePreference(item.key, 'inAppEnabled', checked)
                            }
                            size="sm"
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400">In-App</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <AnimatedToggle
                            checked={getPreferenceValue(item.key, 'emailEnabled')}
                            onChange={(checked) =>
                              updatePreference(item.key, 'emailEnabled', checked)
                            }
                            size="sm"
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Email</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationPreferences
