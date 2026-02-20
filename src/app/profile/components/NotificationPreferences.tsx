'use client'

import { Bell, Filter } from 'lucide-react'
import { AnimatedToggle } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { NotificationType } from '@orm'
import SettingsSection from './SettingsSection'

const allTypes = [
  NotificationType.ACCOUNT_WARNING,
  NotificationType.COMMENT_REPLY,
  NotificationType.COMMENT_DOWNVOTED,
  NotificationType.COMMENT_UPVOTED,
  NotificationType.CONTENT_FLAGGED,
  NotificationType.EMULATOR_UPDATED,
  NotificationType.FEATURE_ANNOUNCEMENT,
  NotificationType.FOLLOWED_USER_NEW_LISTING,
  NotificationType.FOLLOWED_USER_NEW_PC_LISTING,
  NotificationType.FRIEND_REQUEST_ACCEPTED,
  NotificationType.FRIEND_REQUEST_RECEIVED,
  NotificationType.GAME_ADDED,
  NotificationType.LISTING_APPROVED,
  NotificationType.LISTING_COMMENT,
  NotificationType.LISTING_REJECTED,
  NotificationType.LISTING_VOTE_DOWN,
  NotificationType.LISTING_VOTE_UP,
  NotificationType.MAINTENANCE_NOTICE,
  NotificationType.MONTHLY_ACTIVE_BONUS,
  NotificationType.NEW_DEVICE_LISTING,
  NotificationType.NEW_FOLLOWER,
  NotificationType.NEW_SOC_LISTING,
  NotificationType.POLICY_UPDATE,
  NotificationType.REPORT_CREATED,
  NotificationType.REPORT_STATUS_CHANGED,
  NotificationType.ROLE_CHANGED,
  NotificationType.USER_BANNED,
  NotificationType.USER_MENTION,
  NotificationType.USER_UNBANNED,
  NotificationType.VERIFIED_DEVELOPER,
  NotificationType.WEEKLY_DIGEST,
]

type NotificationPreferencesData = RouterOutput['notifications']['getPreferences']
type UserPreferencesData = RouterOutput['userPreferences']['get']

interface Props {
  notificationPreferencesQuery: {
    data?: NotificationPreferencesData
    isPending: boolean
    error?: unknown
  }
  preferencesQuery: {
    data?: UserPreferencesData
    isPending: boolean
    error?: unknown
  }
}

function NotificationPreferences(props: Props) {
  const utils = api.useUtils()

  const updateSinglePreference = api.notifications.updatePreference.useMutation({
    onSuccess: () => {
      utils.notifications.getPreferences.invalidate().catch(console.error)
      toast.success('Notification preference updated!')
    },
    onError: (error) => {
      toast.error(`Failed to update preference: ${getErrorMessage(error)}`)
    },
  })

  const bulkUpdatePreferences = api.notifications.bulkUpdatePreferences.useMutation({
    onSuccess: () => {
      utils.notifications.getPreferences.invalidate().catch(console.error)
      toast.success('All notification preferences updated!')
    },
    onError: (error) => {
      toast.error(`Failed to update preferences: ${getErrorMessage(error)}`)
    },
  })

  const updateUserPreferences = api.userPreferences.update.useMutation({
    onSuccess: () => {
      utils.userPreferences.get.invalidate().catch(console.error)
      toast.success('Preference updated!')
    },
    onError: (error) => {
      toast.error(`Failed to update preference: ${getErrorMessage(error)}`)
    },
  })

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

  function updatePreference(type: string, field: 'inAppEnabled' | 'emailEnabled', value: boolean) {
    if (type === 'general') {
      bulkUpdatePreferences.mutate({
        types: allTypes,
        [field]: value,
      })
      return
    }
    updateSinglePreference.mutate({
      type: type as NotificationType,
      [field]: value,
    })
  }

  const isMutating = updateSinglePreference.isPending || bulkUpdatePreferences.isPending

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
          label: 'Report Comments',
          description: 'When someone comments on your reports',
        },
        {
          key: NotificationType.LISTING_VOTE_UP,
          label: 'Upvotes',
          description: 'When someone upvotes your reports',
        },
        {
          key: NotificationType.LISTING_VOTE_DOWN,
          label: 'Downvotes',
          description: 'When someone downvotes your reports',
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
        {
          key: NotificationType.COMMENT_UPVOTED,
          label: 'Comment Upvotes',
          description: 'When someone upvotes your comments',
        },
        {
          key: NotificationType.COMMENT_DOWNVOTED,
          label: 'Comment Downvotes',
          description: 'When someone downvotes your comments',
        },
      ],
    },
    {
      title: 'Content Updates',
      description: 'Notifications about new content',
      items: [
        {
          key: NotificationType.NEW_DEVICE_LISTING,
          label: 'New Device Reports',
          description: 'When new devices are added',
        },
        {
          key: NotificationType.NEW_SOC_LISTING,
          label: 'New SOC Reports',
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
      title: 'Social',
      description: 'Notifications about followers and friends',
      items: [
        {
          key: NotificationType.NEW_FOLLOWER,
          label: 'New Followers',
          description: 'When someone follows you',
        },
        {
          key: NotificationType.FRIEND_REQUEST_RECEIVED,
          label: 'Friend Requests',
          description: 'When someone sends you a friend request',
        },
        {
          key: NotificationType.FRIEND_REQUEST_ACCEPTED,
          label: 'Friend Request Accepted',
          description: 'When someone accepts your friend request',
        },
        {
          key: NotificationType.FOLLOWED_USER_NEW_LISTING,
          label: 'Followed User Reports',
          description: 'When a user you follow submits a new handheld report',
        },
        {
          key: NotificationType.FOLLOWED_USER_NEW_PC_LISTING,
          label: 'Followed User PC Reports',
          description: 'When a user you follow submits a new PC report',
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
        {
          key: NotificationType.WEEKLY_DIGEST,
          label: 'Weekly Digest',
          description: 'Weekly summary of activity',
        },
        {
          key: NotificationType.MONTHLY_ACTIVE_BONUS,
          label: 'Monthly Activity Bonus',
          description: 'Get notified when a monthly bonus is awarded',
        },
      ],
    },
    {
      title: 'Moderation',
      description: 'Notifications about content moderation',
      items: [
        {
          key: NotificationType.LISTING_APPROVED,
          label: 'Report Approved',
          description: 'When your reports are approved',
        },
        {
          key: NotificationType.LISTING_REJECTED,
          label: 'Report Rejected',
          description: 'When your reports are rejected',
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
        {
          key: NotificationType.REPORT_STATUS_CHANGED,
          label: 'Report Status Updates',
          description: 'When the status of your report changes',
        },
        {
          key: NotificationType.REPORT_CREATED,
          label: 'New Reports (moderators)',
          description: 'Notify when a new report is created',
        },
        {
          key: NotificationType.USER_BANNED,
          label: 'Ban Issued (to you)',
          description: 'When your account is banned',
        },
        {
          key: NotificationType.USER_UNBANNED,
          label: 'Ban Lifted (to you)',
          description: 'When your account ban is lifted',
        },
        {
          key: NotificationType.VERIFIED_DEVELOPER,
          label: 'Verified Developer',
          description: 'When you are verified as a developer for an emulator',
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {props.preferencesQuery.data && (
        <SettingsSection
          title="Device & SOC Alerts"
          description="Get notified when new reports match your hardware preferences"
          icon={<Filter className="w-6 h-6" />}
          delay={0}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Notify on New Reports
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Get notified when new compatibility reports match your preferred devices/SOCs
              </p>
            </div>
            <AnimatedToggle
              checked={props.preferencesQuery.data.notifyOnNewListings}
              onChange={(value) => updateUserPreferences.mutate({ notifyOnNewListings: value })}
              disabled={updateUserPreferences.isPending}
            />
          </div>
        </SettingsSection>
      )}

      {notificationCategories.map((category, index) => (
        <SettingsSection
          key={category.title}
          title={category.title}
          description={category.description}
          icon={<Bell className="w-6 h-6" />}
          delay={(index + 1) * 0.05}
        >
          <div className="space-y-4">
            {category.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>

                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <AnimatedToggle
                      checked={getPreferenceValue(item.key, 'inAppEnabled')}
                      onChange={(checked) => updatePreference(item.key, 'inAppEnabled', checked)}
                      size="sm"
                      disabled={isMutating}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">In-App</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <AnimatedToggle
                      checked={getPreferenceValue(item.key, 'emailEnabled')}
                      onChange={(checked) => updatePreference(item.key, 'emailEnabled', checked)}
                      size="sm"
                      disabled={isMutating}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Email</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SettingsSection>
      ))}
    </div>
  )
}

export default NotificationPreferences
