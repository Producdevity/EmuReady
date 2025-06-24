'use client'

import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DeviceOption } from './DeviceSelector'

interface Props {
  lastUsedDevice: DeviceOption | null
  onSelectLastUsedDevice: () => void
  isLoading: boolean
  className?: string
}

function LastUsedDeviceSelector(props: Props) {
  if (props.isLoading || !props.lastUsedDevice) {
    return null
  }

  return (
    <div className={cn('mt-2', props.className)}>
      <button
        type="button"
        onClick={props.onSelectLastUsedDevice}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
      >
        <Clock className="w-3 h-3" />
        <span>
          Last used:{' '}
          <strong>
            {props.lastUsedDevice.brand.name} {props.lastUsedDevice.modelName}
          </strong>
        </span>
      </button>
    </div>
  )
}

export default LastUsedDeviceSelector
