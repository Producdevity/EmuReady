'use client'

import { type UseQueryResult } from '@tanstack/react-query'
import { Smartphone, Cpu, Settings } from 'lucide-react'
import { useState } from 'react'
import { AnimatedToggle } from '@/components/ui'
import DeviceMultiSelect from '@/features/hardware/device/client/components/DeviceMultiSelect'
import SocMultiSelect from '@/features/hardware/soc/client/components/SocMultiSelect'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type UserPreferencesData = RouterOutput['userPreferences']['get']

interface Props {
  preferencesQuery: UseQueryResult<UserPreferencesData, unknown>
}

function DeviceAndSocPreferences(props: Props) {
  const utils = api.useUtils()
  const [deviceDraft, setDeviceDraft] = useState<string[] | null>(null)
  const [socDraft, setSocDraft] = useState<string[] | null>(null)

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
    scope: { id: 'hardware-preferences' },
    onSuccess: async (data, variables) => {
      utils.userPreferences.get.setData(undefined, (current) =>
        current ? { ...current, devicePreferences: data } : current,
      )
      await invalidatePreferences()
      setDeviceDraft((current) => clearSubmittedSelection(current, variables.deviceIds))
      toast.success('Device preferences updated successfully!')

      analytics.user.preferencesUpdated({
        userId: props.preferencesQuery.data?.id || 'unknown',
        preferenceType: 'device',
        action: 'updated',
      })
    },
    onError: (error, variables) => {
      setDeviceDraft((current) => clearSubmittedSelection(current, variables.deviceIds))
      console.error('Error updating device preferences:', error)
      toast.error(`Failed to update device preferences: ${getErrorMessage(error)}`)
    },
  })

  const bulkUpdateSocs = api.userPreferences.bulkUpdateSocs.useMutation({
    scope: { id: 'hardware-preferences' },
    onSuccess: async (data, variables) => {
      utils.userPreferences.get.setData(undefined, (current) =>
        current ? { ...current, socPreferences: data } : current,
      )
      await invalidatePreferences()
      setSocDraft((current) => clearSubmittedSelection(current, variables.socIds))
      toast.success('SOC preferences updated successfully!')

      analytics.user.preferencesUpdated({
        userId: props.preferencesQuery.data?.id || 'unknown',
        preferenceType: 'soc',
        action: 'updated',
      })
    },
    onError: (error, variables) => {
      setSocDraft((current) => clearSubmittedSelection(current, variables.socIds))
      console.error('Error updating SOC preferences:', error)
      toast.error(`Failed to update SOC preferences: ${getErrorMessage(error)}`)
    },
  })

  const invalidatePreferences = () => {
    return Promise.all([
      utils.userPreferences.get.invalidate(),
      utils.users.me.invalidate(),
      utils.listings.get.invalidate(),
    ]).catch(console.error)
  }

  function handleDevicePreferenceChange(
    key: 'defaultToUserDevices' | 'defaultToUserSocs' | 'notifyOnNewListings' | 'showNsfw',
    value: boolean,
  ) {
    updatePreferences.mutate({ [key]: value })
  }

  function handleDevicesChange(deviceIds: string[]) {
    const submittedIds = [...deviceIds]
    setDeviceDraft(submittedIds)
    bulkUpdateDevices.mutate({ deviceIds: submittedIds })
  }

  function handleSocsChange(socIds: string[]) {
    const submittedIds = [...socIds]
    setSocDraft(submittedIds)
    bulkUpdateSocs.mutate({ socIds: submittedIds })
  }

  if (props.preferencesQuery.isPending) {
    return (
      <div className="space-y-8">
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

  const selectedDeviceIds =
    deviceDraft ?? preferences.devicePreferences.map((pref) => pref.device.id)
  const selectedSocIds = socDraft ?? preferences.socPreferences.map((pref) => pref.soc.id)

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filters</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Default to My Devices</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically filter reports to show only your preferred devices
              </p>
            </div>
            <AnimatedToggle
              checked={preferences.defaultToUserDevices}
              onChange={(value) => handleDevicePreferenceChange('defaultToUserDevices', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Default to My SOCs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically filter reports to show only your preferred SOCs
              </p>
            </div>
            <AnimatedToggle
              checked={preferences.defaultToUserSocs}
              onChange={(value) => handleDevicePreferenceChange('defaultToUserSocs', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Notify on New Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get notified when new compatibility reports match your preferred devices/SOCs
              </p>
            </div>
            <AnimatedToggle
              checked={preferences.notifyOnNewListings}
              onChange={(value) => handleDevicePreferenceChange('notifyOnNewListings', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Show Mature Content</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Include erotic 18+ games in results
              </p>
            </div>
            <AnimatedToggle
              checked={preferences.showNsfw}
              onChange={(value) => handleDevicePreferenceChange('showNsfw', value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Smartphone className="h-6 w-6 text-green-600 dark:text-green-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Device Preferences
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select the devices you own or are interested in. This helps personalize your experience
          and filter relevant content.
        </p>

        <DeviceMultiSelect
          label="Preferred devices"
          value={selectedDeviceIds}
          onChange={handleDevicesChange}
          placeholder="Select your devices"
          maxDisplayed={3}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Cpu className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">SOC Preferences</h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select the System-on-Chip (SOC) architectures you&apos;re interested in. This helps filter
          reports to show performance data most relevant to you.
        </p>

        <SocMultiSelect
          label="Preferred SoCs"
          value={selectedSocIds}
          onChange={handleSocsChange}
          placeholder="Select your SoCs"
          maxDisplayed={3}
        />
      </div>
    </div>
  )
}

function clearSubmittedSelection(current: string[] | null, submitted: string[]): string[] | null {
  return current === submitted ? null : current
}

export default DeviceAndSocPreferences
