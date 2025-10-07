'use client'

import { Clock } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type DeviceOption } from '../types'

interface Props {
  lastUsedDevice: DeviceOption | null
  onSelectLastUsedDevice: () => void
  isLoading: boolean
  className?: string
}

function LastUsedDeviceSelector(props: Props) {
  if (props.isLoading || !props.lastUsedDevice) return null

  return (
    <div className={cn('mt-2', props.className)}>
      <Button
        size="sm"
        variant="ghost"
        onClick={props.onSelectLastUsedDevice}
        icon={Clock}
        className="text-xs cursor-pointer"
      >
        <span>
          Select last used:{' '}
          <strong>
            {props.lastUsedDevice.brand.name} {props.lastUsedDevice.modelName}
          </strong>
        </span>
      </Button>
    </div>
  )
}

export default LastUsedDeviceSelector
