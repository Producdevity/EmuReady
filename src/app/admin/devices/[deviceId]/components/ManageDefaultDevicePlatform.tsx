'use client'

import { useState, useEffect } from 'react'
import { Button, Dropdown } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type Platform = RouterOutput['platforms']['get'][number]

interface Props {
  deviceId: string
  supportedPlatforms: Platform[]
  currentDefaultPlatformId: string | null
}

function ManageDefaultDevicePlatform(props: Props) {
  const [value, setValue] = useState<string | null>(props.currentDefaultPlatformId)

  useEffect(() => {
    setValue(props.currentDefaultPlatformId)
  }, [props.currentDefaultPlatformId])

  const utils = api.useUtils()
  const updateMutation = api.devices.updateDefaultPlatform.useMutation({
    onSuccess: async () => {
      toast.success('Default platform updated.')
      await utils.devices.byId.invalidate({ id: props.deviceId })
    },
    onError: (error) => {
      toast.error(`Error: ${getErrorMessage(error)}`)
      console.error('Error updating default platform:', error)
    },
  })

  const handleSave = () => {
    updateMutation.mutate({ deviceId: props.deviceId, platformId: value })
  }

  const handleClear = () => {
    setValue(null)
    updateMutation.mutate({ deviceId: props.deviceId, platformId: null })
  }

  if (props.supportedPlatforms.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Add at least one supported platform above before setting a default.
      </p>
    )
  }

  const isDirty = (value ?? null) !== (props.currentDefaultPlatformId ?? null)
  const dropdownOptions = props.supportedPlatforms.map((p) => ({
    value: p.id,
    label: p.name,
  }))

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        The default platform is used when a new listing is created for this device and the user does
        not explicitly pick a platform. Must be one of the supported platforms.
      </p>

      <Dropdown
        label="Default Platform"
        options={dropdownOptions}
        value={value ?? ''}
        onChange={(next) => setValue(next === '' ? null : next)}
        placeholder="No default platform"
      />

      <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
        {props.currentDefaultPlatformId !== null ? (
          <Button variant="outline" onClick={handleClear} disabled={updateMutation.isPending}>
            Clear default
          </Button>
        ) : null}
        <Button
          onClick={handleSave}
          isLoading={updateMutation.isPending}
          disabled={updateMutation.isPending || !isDirty}
          variant="primary"
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export default ManageDefaultDevicePlatform
