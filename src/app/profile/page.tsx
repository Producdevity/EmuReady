'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/lib/api'
import { PageLoading, AnimatedToggle } from '@/components/ui'
import SettingsSection from './components/SettingsSection'
import {
  User,
  Settings,
  Smartphone,
  Bell,
  Shield,
  Mail,
  Globe,
  Moon,
} from 'lucide-react'
import ProfilePageUnauthenticated from './components/ProfilePageUnauthenticated'
import ProfilePageError from './components/ProfilePageError'
import ProfileHeader from './components/ProfileHeader'
import ProfileTabs from './components/ProfileTabs'
import DeviceSelector from './components/DeviceSelector'
import { type RouterInput } from '@/types/trpc'
import { Role } from '@orm'
import toast from '@/lib/toast'

import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission } from '@/utils/permissions'

function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')

  const utils = api.useUtils()
  const userQuery = api.users.getProfile.useQuery(undefined, {
    enabled: !!user,
  })

  // User preferences query
  const preferencesQuery = api.userPreferences.get.useQuery(undefined, {
    enabled: !!user,
  })

  const updatePreferences = api.userPreferences.update.useMutation({
    onSuccess: () => {
      utils.userPreferences.get.invalidate().catch(console.error)
      toast.success('Preferences updated successfully!')
    },
    onError: (error) => {
      console.error('Error updating preferences:', error)
      toast.error(`Failed to update preferences: ${getErrorMessage(error)}`)
    },
  })

  const bulkUpdateDevices = api.userPreferences.bulkUpdateDevices.useMutation({
    onSuccess: () => {
      utils.userPreferences.get.invalidate().catch(console.error)
      toast.success('Device preferences updated successfully!')
    },
    onError: (error) => {
      console.error('Error updating device preferences:', error)
      toast.error(
        `Failed to update device preferences: ${getErrorMessage(error)}`,
      )
    },
  })

  const updateProfile = api.users.update.useMutation({
    onMutate: async (newData) => {
      setProfileImage(newData.profileImage ?? null)
    },
    onSuccess: () => {
      utils.users.getProfile.invalidate().catch(console.error)
      toast.success('Profile updated successfully!')
    },
    onError: (error) => {
      setProfileImage(userQuery.data?.profileImage ?? null)
      console.error('Error updating profile:', error)
      toast.error(`Failed to update profile: ${getErrorMessage(error)}`)
    },
  })

  async function handleImageUpload(imageUrl: string) {
    setProfileImage(imageUrl)
    updateProfile.mutate({
      profileImage: imageUrl,
    } satisfies RouterInput['users']['update'])
  }

  function handleEditToggle() {
    setIsEditing(!isEditing)
  }

  function handleDevicePreferenceChange(
    key: 'defaultToUserDevices' | 'notifyOnNewListings',
    value: boolean,
  ) {
    updatePreferences.mutate({
      [key]: value,
    })
  }

  if (!isLoaded || (userQuery.isLoading && user) || preferencesQuery.isLoading)
    return <PageLoading />

  if (!user) return <ProfilePageUnauthenticated />

  if (!userQuery.data) return <ProfilePageError />

  const userRole = userQuery.data?.role
  const preferences = preferencesQuery.data

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: 'devices',
      label: 'My Devices',
      icon: <Smartphone className="w-5 h-5" />,
      badge: preferences?.devicePreferences?.length ?? 0,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
    },
  ]

  if (hasPermission(userRole, Role.ADMIN)) {
    tabs.push({
      id: 'admin',
      label: 'Admin Settings',
      icon: <Shield className="w-5 h-5" />,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <ProfileHeader
            user={user}
            profileData={userQuery.data}
            currentImage={profileImage}
            onImageUpload={handleImageUpload}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
          />

          {/* Main Content Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
              <ProfileTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                className="px-8 py-2"
              />
            </div>

            {/* Tab Content */}
            <div className="p-8 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 dark:from-gray-800 dark:via-gray-800/80 dark:to-blue-900/10">
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <SettingsSection
                    title="Basic Information"
                    description="Manage your basic profile information"
                    icon={<User className="w-5 h-5" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          defaultValue={user.fullName ?? ''}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            value={user.primaryEmailAddress?.emailAddress ?? ''}
                            disabled
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Email cannot be changed here. Manage via your account
                          settings.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-all duration-200 resize-none"
                      />
                    </div>

                    {isEditing && (
                      <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-900 dark:text-gray-100 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </SettingsSection>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-8">
                  <SettingsSection
                    title="Display Preferences"
                    description="Customize how you view content"
                    icon={<Globe className="w-5 h-5" />}
                    delay={0.1}
                  >
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <AnimatedToggle
                          checked={preferences?.defaultToUserDevices ?? false}
                          onChange={(checked) =>
                            handleDevicePreferenceChange(
                              'defaultToUserDevices',
                              checked,
                            )
                          }
                          label="Filter listings by my devices"
                          description="When enabled, listings will be filtered to show only your selected devices by default"
                        />
                      </div>
                    </div>
                  </SettingsSection>

                  <SettingsSection
                    title="Theme & Appearance"
                    description="Customize the look and feel"
                    icon={<Moon className="w-5 h-5" />}
                    delay={0.2}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Dark Mode
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Automatically handled by system preference
                          </p>
                        </div>
                        <div className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 shadow-sm">
                          System controlled
                        </div>
                      </div>
                    </div>
                  </SettingsSection>
                </div>
              )}

              {activeTab === 'devices' && (
                <div className="space-y-8">
                  <SettingsSection
                    title="My Devices"
                    description="Select the devices you own or are interested in to personalize your experience"
                    icon={<Smartphone className="w-5 h-5" />}
                    delay={0.1}
                  >
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-1 border border-green-200 dark:border-green-800">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                        <DeviceSelector
                          selectedDevices={
                            preferences?.devicePreferences?.map(
                              (pref) => pref.device,
                            ) ?? []
                          }
                          onDevicesChange={(devices) => {
                            bulkUpdateDevices.mutate({
                              deviceIds: devices.map((device) => device.id),
                            })
                          }}
                        />
                      </div>
                    </div>
                  </SettingsSection>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <SettingsSection
                    title="Notification Preferences"
                    description="Control what notifications you receive"
                    icon={<Bell className="w-5 h-5" />}
                    delay={0.1}
                  >
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                        <AnimatedToggle
                          checked={preferences?.notifyOnNewListings ?? true}
                          onChange={(checked) =>
                            handleDevicePreferenceChange(
                              'notifyOnNewListings',
                              checked,
                            )
                          }
                          label="New listings for my devices"
                          description="Get notified when new compatibility listings are added for your devices"
                        />
                      </div>

                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 opacity-60">
                        <AnimatedToggle
                          checked={false}
                          onChange={() => {}}
                          disabled
                          label="Weekly digest"
                          description="Receive a weekly summary of activity (Coming soon)"
                        />
                      </div>

                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 opacity-60">
                        <AnimatedToggle
                          checked={false}
                          onChange={() => {}}
                          disabled
                          label="Comment replies"
                          description="Get notified when someone replies to your comments (Coming soon)"
                        />
                      </div>
                    </div>
                  </SettingsSection>
                </div>
              )}

              {activeTab === 'admin' &&
                (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) && (
                  <div className="space-y-8">
                    <SettingsSection
                      title="Admin Settings"
                      description="Administrative tools and preferences"
                      icon={<Shield className="w-5 h-5" />}
                      delay={0.1}
                    >
                      <div className="text-center py-16 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                          <Shield className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          Admin Settings Coming Soon
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                          Advanced administrative settings and tools will be
                          available here.
                        </p>
                      </div>
                    </SettingsSection>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
