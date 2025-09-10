import { useMemo, useState } from 'react'
import type { RouterOutput } from '@/types/trpc'

type UserPreferences = RouterOutput['userPreferences']['get'] | null | undefined

interface Options {
  userPreferences: UserPreferences
  deviceIds: string[]
  socIds: string[]
}

export function usePreferredHardwareFilters(opts: Options) {
  const { userPreferences, deviceIds, socIds } = opts

  const [userDeviceFilterDisabled, setUserDeviceFilterDisabled] = useState(false)
  const [userSocFilterDisabled, setUserSocFilterDisabled] = useState(false)

  const userDeviceIds = useMemo(
    () =>
      userPreferences?.defaultToUserDevices && userPreferences.devicePreferences
        ? userPreferences.devicePreferences.map((pref) => pref.deviceId)
        : [],
    [userPreferences?.defaultToUserDevices, userPreferences?.devicePreferences],
  )

  const userSocIds = useMemo(
    () =>
      userPreferences?.defaultToUserSocs && userPreferences.socPreferences
        ? userPreferences.socPreferences.map((pref) => pref.socId)
        : [],
    [userPreferences?.defaultToUserSocs, userPreferences?.socPreferences],
  )

  const shouldUseUserDeviceFilter =
    !!userPreferences?.defaultToUserDevices &&
    deviceIds.length === 0 &&
    userDeviceIds.length > 0 &&
    !userDeviceFilterDisabled

  const shouldUseUserSocFilter =
    !!userPreferences?.defaultToUserSocs &&
    socIds.length === 0 &&
    userSocIds.length > 0 &&
    !userSocFilterDisabled

  const appliedDeviceIds =
    deviceIds.length > 0 ? deviceIds : shouldUseUserDeviceFilter ? userDeviceIds : undefined
  const appliedSocIds = socIds.length > 0 ? socIds : shouldUseUserSocFilter ? userSocIds : undefined

  const enableUserDeviceFilter = () => setUserDeviceFilterDisabled(false)
  const enableUserSocFilter = () => setUserSocFilterDisabled(false)

  return {
    userDeviceIds,
    userSocIds,
    shouldUseUserDeviceFilter,
    shouldUseUserSocFilter,
    userDeviceFilterDisabled,
    userSocFilterDisabled,
    setUserDeviceFilterDisabled,
    setUserSocFilterDisabled,
    appliedDeviceIds,
    appliedSocIds,
    enableUserDeviceFilter,
    enableUserSocFilter,
  }
}
