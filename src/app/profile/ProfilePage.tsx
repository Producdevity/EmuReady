'use client'

import { useUser } from '@clerk/nextjs'
import { User, Smartphone, Bell, Settings, Computer, KeyRound, Shield, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense, useEffect } from 'react'
import { Button, PageSkeletonLoading } from '@/components/ui'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import AccountSettings from './components/AccountSettings'
import ConnectionsManager from './components/ConnectionsManager'
import DeviceAndSocPreferences from './components/DeviceAndSocPreferences'
import NotificationPreferences from './components/NotificationPreferences'
import PcPresets from './components/PcPresets'
import PrivacySettings from './components/PrivacySettings'
import ProfileHeader from './components/ProfileHeader'
import ProfileInformation from './components/ProfileInformation'
import ProfilePageError from './components/ProfilePageError'
import ProfilePageUnauthenticated from './components/ProfilePageUnauthenticated'
import ProfileTabs from './components/ProfileTabs'
import SettingsSection from './components/SettingsSection'

const baseTabs = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="w-4 h-4" />,
  },
  {
    id: 'account',
    label: 'Account',
    icon: <KeyRound className="w-4 h-4" />,
  },
  {
    id: 'connections',
    label: 'Connections',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: <Shield className="w-4 h-4" />,
  },
  {
    id: 'devices',
    label: 'My Devices & Filters',
    icon: <Smartphone className="w-4 h-4" />,
  },
  {
    id: 'pc-presets',
    label: 'My PC Hardware',
    icon: <Computer className="w-4 h-4" />,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="w-4 h-4" />,
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: <Settings className="w-4 h-4" />,
  },
]

function ProfilePage() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
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
    analytics.navigation.pageView({ page: 'profile', section: 'main' })
  }, [pathname])

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

    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('tab', tabId)
    router.replace(`/profile?${params.toString()}`)

    analytics.navigation.menuItemClicked({
      menuItem: `profile_tab_${tabId}`,
      section: 'profile',
      page: 'profile',
    })
  }

  // Keep state in sync with URL (back/forward or external links)
  useEffect(() => {
    const tab = searchParams.get('tab') || 'profile'
    setActiveTab(tab)
  }, [searchParams])

  if (!isLoaded) return <PageSkeletonLoading />

  if (!user) return <ProfilePageUnauthenticated />

  if (userQuery.error) return <ProfilePageError />

  // Filter tabs based on user permissions
  const visibleTabs = baseTabs.filter((tab) =>
    tab.id === 'admin' ? hasRolePermission(userQuery.data?.role, Role.MODERATOR) : true,
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

          {activeTab === 'account' && <AccountSettings />}

          {activeTab === 'privacy' && <PrivacySettings preferencesQuery={preferencesQuery} />}

          {activeTab === 'connections' && userQuery.data && (
            <ConnectionsManager userId={userQuery.data.id} />
          )}

          {activeTab === 'devices' && (
            <DeviceAndSocPreferences preferencesQuery={preferencesQuery} />
          )}

          {activeTab === 'pc-presets' && <PcPresets />}

          {activeTab === 'notifications' && (
            <NotificationPreferences
              notificationPreferencesQuery={notificationPreferencesQuery}
              preferencesQuery={preferencesQuery}
            />
          )}

          {activeTab === 'admin' && hasRolePermission(userQuery.data?.role, Role.MODERATOR) && (
            <SettingsSection
              title="Admin Tools"
              description="Quick access to administrative areas"
              icon={<Settings className="w-6 h-6" />}
            >
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm" asChild>
                  <Link href="/admin">Admin Dashboard</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/reports">Reports</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/users">Users</Link>
                </Button>
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
