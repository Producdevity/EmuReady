'use client'

import { Eye, Activity, Users } from 'lucide-react'
import { AnimatedToggle } from '@/components/ui'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import SettingsSection from './SettingsSection'

type UserPreferencesData = RouterOutput['userPreferences']['get']

interface Props {
  preferencesQuery: {
    data?: UserPreferencesData
    isPending: boolean
    error?: unknown
  }
}

type PrivacyField =
  | 'profilePublic'
  | 'showActivityInFeed'
  | 'showVotingActivity'
  | 'allowFollows'
  | 'allowFriendRequests'
  | 'followersVisible'
  | 'followingVisible'
  | 'bookmarksVisible'
  | 'followedGamesVisible'

function PrivacySettings(props: Props) {
  const utils = api.useUtils()

  const updatePreferences = api.userPreferences.update.useMutation({
    onSuccess: () => {
      utils.userPreferences.get.invalidate().catch(console.error)
      toast.success('Privacy settings updated')

      analytics.user.preferencesUpdated({
        userId: props.preferencesQuery.data?.id || 'unknown',
        preferenceType: 'privacy',
        action: 'updated',
      })
    },
    onError: (error) => {
      toast.error(`Failed to update privacy settings: ${getErrorMessage(error)}`)
    },
  })

  function handleToggle(field: PrivacyField, value: boolean) {
    updatePreferences.mutate({ [field]: value })
  }

  if (props.preferencesQuery.isPending) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!props.preferencesQuery.data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          Unable to load privacy settings. Please try again.
        </p>
      </div>
    )
  }

  const preferences = props.preferencesQuery.data

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Profile Visibility"
        description="Control who can see your profile information"
        icon={<Eye className="w-6 h-6" />}
      >
        <ToggleRow
          label="Make my profile public"
          description="When off, only your name and avatar are visible to others"
          checked={preferences.profilePublic}
          onChange={(value) => handleToggle('profilePublic', value)}
          disabled={updatePreferences.isPending}
        />
      </SettingsSection>

      <SettingsSection
        title="Activity"
        description="Control how your activity appears to others"
        icon={<Activity className="w-6 h-6" />}
        delay={0.1}
      >
        <ToggleRow
          label="Show my reports in others' activity feeds"
          description="When off, your compatibility reports won't appear in your followers' feeds"
          checked={preferences.showActivityInFeed}
          onChange={(value) => handleToggle('showActivityInFeed', value)}
          disabled={updatePreferences.isPending}
        />
        <ToggleRow
          label="Show my voting activity on my profile"
          description="When off, the votes tab on your profile is hidden from others"
          checked={preferences.showVotingActivity}
          onChange={(value) => handleToggle('showVotingActivity', value)}
          disabled={updatePreferences.isPending}
        />
        <ToggleRow
          label="Show my bookmarks on my profile"
          description="When off, your bookmarked listings are only visible to you"
          checked={preferences.bookmarksVisible}
          onChange={(value) => handleToggle('bookmarksVisible', value)}
          disabled={updatePreferences.isPending}
        />
      </SettingsSection>

      <SettingsSection
        title="Social"
        description="Control how others can interact with you"
        icon={<Users className="w-6 h-6" />}
        delay={0.2}
      >
        <ToggleRow
          label="Allow others to follow me"
          description="When off, nobody can follow your profile"
          checked={preferences.allowFollows}
          onChange={(value) => handleToggle('allowFollows', value)}
          disabled={updatePreferences.isPending}
        />
        <ToggleRow
          label="Allow friend requests"
          description="When off, nobody can send you friend requests"
          checked={preferences.allowFriendRequests}
          onChange={(value) => handleToggle('allowFriendRequests', value)}
          disabled={updatePreferences.isPending}
        />
        <ToggleRow
          label="Show my followers list publicly"
          description="When off, only you and moderators can see who follows you"
          checked={preferences.followersVisible}
          onChange={(value) => handleToggle('followersVisible', value)}
          disabled={updatePreferences.isPending}
        />
        <ToggleRow
          label="Show who I'm following publicly"
          description="When off, only you and moderators can see who you follow"
          checked={preferences.followingVisible}
          onChange={(value) => handleToggle('followingVisible', value)}
          disabled={updatePreferences.isPending}
        />
        <ToggleRow
          label="Show games I follow on my profile"
          description="When off, only you and moderators can see which games you follow"
          checked={preferences.followedGamesVisible}
          onChange={(value) => handleToggle('followedGamesVisible', value)}
          disabled={updatePreferences.isPending}
        />
      </SettingsSection>
    </div>
  )
}

function ToggleRow(props: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-white">{props.label}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{props.description}</p>
      </div>
      <AnimatedToggle
        checked={props.checked}
        onChange={props.onChange}
        disabled={props.disabled}
        label={props.label}
      />
    </div>
  )
}

export default PrivacySettings
