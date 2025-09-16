'use client'

import { useUser } from '@clerk/nextjs'
import { User, Smartphone, Bell, Settings, Computer } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense, useEffect } from 'react'
import { PageSkeletonLoading } from '@/components/ui'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import DeviceAndSocPreferences from './components/DeviceAndSocPreferences'
import NotificationPreferences from './components/NotificationPreferences'
import PcPresets from './components/PcPresets'
import ProfileHeader from './components/ProfileHeader'
import ProfileInformation from './components/ProfileInformation'
import ProfilePageError from './components/ProfilePageError'
import ProfilePageUnauthenticated from './components/ProfilePageUnauthenticated'
import ProfileTabs from './components/ProfileTabs'
import SettingsSection from './components/SettingsSection'

const tabs = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="w-4 h-4" />,
  },
  {
    id: 'devices',
    label: 'Devices & SOCs',
    icon: <Smartphone className="w-4 h-4" />,
  },
  {
    id: 'pc-presets',
    label: 'PC Presets',
    icon: <Computer className="w-4 h-4" />,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="w-4 h-4" />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
  },
]

function ProfilePage() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile')

  const userQuery = api.users.getProfile.useQuery(undefined, {
    enabled: !!user,
  })

  const preferencesQuery = api.userPreferences.get.useQuery(undefined, {
    enabled: !!user,
  })

  const notificationPreferencesQuery = api.notifications.getPreferences.useQuery(undefined, {
    enabled: !!user,
  })

  // Profile page view tracking - only on initial load
  useEffect(() => {
    if (isLoaded && user) {
      analytics.navigation.pageView({
        page: 'profile',
        section: 'main',
      })
    }
  }, [isLoaded, user])

  // Profile completion goal tracking - only fires once
  useEffect(() => {
    if (userQuery.data && preferencesQuery.data) {
      const hasCompletedProfile = !!(
        userQuery.data.bio && preferencesQuery.data.devicePreferences.length > 0
      )

      if (hasCompletedProfile) {
        try {
          // Store in sessionStorage to prevent duplicate tracking
          const storageKey = `profile_completed_${user?.id}`
          if (!sessionStorage.getItem(storageKey)) {
            analytics.conversion.goalCompleted({
              goalType: 'profile_completed',
              userId: user?.id,
            })
            sessionStorage.setItem(storageKey, 'true')
          }
        } catch (error) {
          // SessionStorage might be unavailable (private mode, quota exceeded)
          console.warn('Failed to track profile completion:', error)
        }
      }
    }
  }, [userQuery.data, preferencesQuery.data, user?.id])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)

    // Track tab navigation
    analytics.navigation.menuItemClicked({
      menuItem: `profile_tab_${tabId}`,
      section: 'profile',
      page: 'profile',
    })
  }

  if (!isLoaded) return <PageSkeletonLoading />

  if (!user) return <ProfilePageUnauthenticated />

  if (userQuery.error) return <ProfilePageError />

  // Filter tabs based on user permissions
  const visibleTabs = tabs.filter((tab) =>
    tab.id === 'settings' ? hasRolePermission(userQuery.data?.role, Role.MODERATOR) : true,
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProfileHeader clerkUser={user} profileData={userQuery.data} />

        <div className="mt-8">
          <ProfileTabs tabs={visibleTabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        <div className="mt-8">
          {activeTab === 'profile' && <ProfileInformation userQuery={userQuery} />}

          {activeTab === 'devices' && (
            <DeviceAndSocPreferences preferencesQuery={preferencesQuery} />
          )}

          {activeTab === 'pc-presets' && <PcPresets />}

          {activeTab === 'notifications' && (
            <NotificationPreferences notificationPreferencesQuery={notificationPreferencesQuery} />
          )}

          {activeTab === 'settings' && hasRolePermission(userQuery.data?.role, Role.MODERATOR) && (
            <SettingsSection
              title="Admin Settings"
              description="Administrative tools and configuration options"
              icon={<Settings className="w-6 h-6" />}
            >
              <div className="text-gray-600 dark:text-gray-400">
                Admin settings panel coming soon...
              </div>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfilePageWithSuspense() {
  return (
    <Suspense fallback={<PageSkeletonLoading />}>
      <ProfilePage />
    </Suspense>
  )
}

export default ProfilePageWithSuspense
