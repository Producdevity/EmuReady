'use client'

import { Controller } from 'react-hook-form'
import { Autocomplete, type AutocompleteOptionBase } from '@/components/ui'
import { HardDrive, Info } from 'lucide-react'
import { type RouterInput } from '@/types/trpc'
import { type Control } from 'react-hook-form'
import { type Nullable } from '@/types/utils'

type ListingFormValues = RouterInput['listings']['create']

interface DeviceOption extends AutocompleteOptionBase {
  id: string
  modelName: string
  brand: {
    id: string
    name: string
  }
  soc: {
    id: string
    name: string
    manufacturer: string
  }
}

interface Props {
  control: Control<ListingFormValues>
  selectedDevice: Nullable<DeviceOption>
  errorMessage?: string
  loadDeviceItems: (query: string) => Promise<DeviceOption[]>
  onDeviceSelect: (device: Nullable<DeviceOption>) => void
  deviceSearchTerm: string
}

function DeviceSelector(props: Props) {
  return (
    <>
      <Controller
        name="deviceId"
        control={props.control}
        render={({ field }) => (
          <Autocomplete<DeviceOption>
            label="Device"
            leftIcon={<HardDrive className="w-5 h-5" />}
            value={field.value}
            onChange={(value) => {
              field.onChange(value)
              // Find and set the selected device
              if (!value) return props.onDeviceSelect(null)

              props.loadDeviceItems(props.deviceSearchTerm).then((devices) => {
                const device = devices.find((d) => d.id === value)
                if (device) props.onDeviceSelect(device)
              })
            }}
            loadItems={props.loadDeviceItems}
            optionToValue={(item) => item.id}
            optionToLabel={(item) => `${item.brand.name} ${item.modelName}`}
            customOptionRenderer={(item, isHighlighted) => (
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">
                  {item.brand.name} {item.modelName}
                </span>
                <span
                  className={`text-sm italic ml-2 ${
                    isHighlighted
                      ? 'text-blue-600 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.soc.manufacturer} {item.soc.name}
                </span>
              </div>
            )}
            placeholder="Search for a device..."
            minCharsToTrigger={2}
          />
        )}
      />
      {props.errorMessage && (
        <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>
      )}
      {props.selectedDevice && (
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center text-sm text-green-700 dark:text-green-300">
            <Info className="w-4 h-4 mr-2" />
            <span>
              Selected:{' '}
              <strong>
                {props.selectedDevice.brand.name}{' '}
                {props.selectedDevice.modelName}
              </strong>{' '}
              with{' '}
              <strong>
                {props.selectedDevice.soc.manufacturer}{' '}
                {props.selectedDevice.soc.name}
              </strong>{' '}
              SoC
            </span>
          </div>
        </div>
      )}
    </>
  )
}

export default DeviceSelector
