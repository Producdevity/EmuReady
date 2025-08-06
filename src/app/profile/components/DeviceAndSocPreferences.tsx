'use client'

import { Smartphone, Cpu, Settings } from 'lucide-react'
import { useCallback, useRef, useEffect } from 'react'
import { AnimatedToggle } from '@/components/ui'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import DeviceSelector from './DeviceSelector'
import SocSelector from './SocSelector'

type UserPreferencesData = RouterOutput['userPreferences']['get']

interface Props {
  // TODO: see if we can use UseQueryResult from @tanstack/react-query instead
  preferencesQuery: {
    data?: UserPreferencesData
    isPending: boolean
    error?: unknown
  }
}

function DeviceAndSocPreferences(props: Props) {
  const utils = api.useUtils()

  const updatePreferences = api.userPreferences.update.useMutation({
    onSuccess: () => {
      invalidatePreferences()
      toast.success('Preferences updated successfully!')

      analytics.user.preferencesUpdated({
        userId: props.preferencesQuery.data?.id || 'unknown',
        preferenceType: 'general',
        action: 'updated',
      })
    },
    onError: (error) => {
      console.error('Error updating preferences:', error)
      toast.error(`Failed to update preferences: ${getErrorMessage(error)}`)
    },
  })

  const bulkUpdateDevices = api.userPreferences.bulkUpdateDevices.useMutation({
    onSuccess: () => {
      invalidatePreferences()
      toast.success('Device preferences updated successfully!')

      analytics.user.preferencesUpdated({
        userId: props.preferencesQuery.data?.id || 'unknown',
        preferenceType: 'device',
        action: 'updated',
      })
    },
    onError: (error) => {
      console.error('Error updating device preferences:', error)
      toast.error(
        `Failed to update device preferences: ${getErrorMessage(error)}`,
      )
    },
  })

  const bulkUpdateSocs = api.userPreferences.bulkUpdateSocs.useMutation({
    onSuccess: () => {
      invalidatePreferences()
      toast.success('SOC preferences updated successfully!')

      analytics.user.preferencesUpdated({
        userId: props.preferencesQuery.data?.id || 'unknown',
        preferenceType: 'soc',
        action: 'updated',
      })
    },
    onError: (error) => {
      console.error('Error updating SOC preferences:', error)
      toast.error(`Failed to update SOC preferences: ${getErrorMessage(error)}`)
    },
  })

  /**
   * Invalidate all user preferences related queries.
   */
  const invalidatePreferences = () => {
    Promise.all([
      utils.userPreferences.get.invalidate(),
      utils.users.me.invalidate(),
      utils.listings.get.invalidate(),
    ]).catch(console.error)
  }

  function handleDevicePreferenceChange(
    key:
      | 'defaultToUserDevices'
      | 'defaultToUserSocs'
      | 'notifyOnNewListings'
      | 'showNsfw',
    value: boolean,
  ) {
    updatePreferences.mutate({ [key]: value })
  }

  // Debounce refs to prevent excessive API calls
  const deviceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const socTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (deviceTimeoutRef.current) {
        clearTimeout(deviceTimeoutRef.current)
      }
      if (socTimeoutRef.current) {
        clearTimeout(socTimeoutRef.current)
      }
    }
  }, [])

  const handleDevicesChange = useCallback(
    (
      devices: Array<{
        id: string
        modelName: string
        brand: { id: string; name: string }
        soc?: { id: string; name: string; manufacturer: string } | null
      }>,
    ) => {
      const deviceIds = devices.map((device) => device.id)

      // Clear existing timeout
      if (deviceTimeoutRef.current) {
        clearTimeout(deviceTimeoutRef.current)
      }

      // Set new timeout for debounced update
      deviceTimeoutRef.current = setTimeout(() => {
        bulkUpdateDevices.mutate({ deviceIds })
      }, 500) // 500ms debounce
    },
    [bulkUpdateDevices],
  )

  const handleSocsChange = useCallback(
    (socs: typeof selectedSocs) => {
      const socIds = socs.map((soc) => soc.id)

      // Clear existing timeout
      if (socTimeoutRef.current) {
        clearTimeout(socTimeoutRef.current)
      }

      // Set new timeout for debounced update
      socTimeoutRef.current = setTimeout(() => {
        bulkUpdateSocs.mutate({ socIds })
      }, 500) // 500ms debounce
    },
    [bulkUpdateSocs],
  )

  if (props.preferencesQuery.isPending) {
    return (
      <div className="space-y-8">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!props.preferencesQuery.data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          Unable to load preferences. Please try again.
        </p>
      </div>
    )
  }

  const { data: preferences } = props.preferencesQuery

  // Map the data structure to what the selectors expect
  const selectedDevices =
    preferences.devicePreferences?.map((pref) => pref.device) || []
  const selectedSocs = preferences.socPreferences?.map((pref) => pref.soc) || []

  return (
    <div className="space-y-8">
      {/* General Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            General Preferences
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Default to My Devices
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically filter listings to show only your preferred
                devices
              </p>
            </div>
            <AnimatedToggle
              checked={preferences.defaultToUserDevices}
              onChange={(value) =>
                handleDevicePreferenceChange('defaultToUserDevices', value)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Default to My SOCs
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically filter listings to show only your preferred SOCs
              </p>
            </div>
            <AnimatedToggle
              checked={preferences.defaultToUserSocs}
              onChange={(value) =>
                handleDevicePreferenceChange('defaultToUserSocs', value)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Notify on New Listings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get notified when new listings are posted for your preferred
                devices/SOCs
              </p>
            </div>
            <AnimatedToggle
              checked={preferences.notifyOnNewListings}
              onChange={(value) =>
                handleDevicePreferenceChange('notifyOnNewListings', value)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Show Mature Content
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Include erotic 18+ games in listings
              </p>
            </div>
            <AnimatedToggle
              checked={preferences.showNsfw}
              onChange={(value) =>
                handleDevicePreferenceChange('showNsfw', value)
              }
            />
          </div>
        </div>
      </div>

      {/* Device Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Smartphone className="h-6 w-6 text-green-600 dark:text-green-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Device Preferences
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select the devices you own or are interested in. This helps
          personalize your experience and filter relevant content.
        </p>

        <DeviceSelector
          selectedDevices={selectedDevices}
          onDevicesChange={handleDevicesChange}
        />
      </div>

      {/* SOC Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Cpu className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            SOC Preferences
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select the System-on-Chip (SOC) architectures you&apos;re interested
          in. This helps filter listings to show performance data most relevant
          to you.
        </p>

        <SocSelector
          selectedSocs={selectedSocs}
          onSocsChange={handleSocsChange}
        />
      </div>
    </div>
  )
}

export default DeviceAndSocPreferences
