'use client'

import { MonitorSmartphone, Cpu } from 'lucide-react'
import { useRef } from 'react'
import { Controller } from 'react-hook-form'
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Autocomplete } from '@/components/ui'
import { useLastUsedDevice } from '@/hooks/useLastUsedDevice'
import { logger } from '@/lib/logger'
import { type Nullable } from '@/types/utils'
import LastUsedDeviceSelector from './LastUsedDeviceSelector'
import { SelectedItemCard } from '../SelectedItemCard'
import { type DeviceOption } from '../types'

interface Props<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  selectedDevice: Nullable<DeviceOption>
  errorMessage?: string
  loadDeviceItems: (query: string) => Promise<DeviceOption[]>
  onDeviceSelect: (device: Nullable<DeviceOption>) => void
  deviceSearchTerm: string
}

export function DeviceSelector<TFieldValues extends FieldValues = FieldValues>(
  props: Props<TFieldValues>,
) {
  const {
    lastUsedDevice,
    setLastUsedDevice,
    isLoading: isLastUsedDeviceLoading,
  } = useLastUsedDevice()
  const fieldOnChangeRef = useRef<((value: string) => void) | null>(null)

  const handleLastUsedDeviceSelect = () => {
    if (!lastUsedDevice || !fieldOnChangeRef.current) return

    fieldOnChangeRef.current(lastUsedDevice.id)
    props.onDeviceSelect(lastUsedDevice)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Device
      </label>

      {props.selectedDevice ? (
        <SelectedItemCard
          leftContent={
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
              <MonitorSmartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          }
          title={`${props.selectedDevice.brand.name} ${props.selectedDevice.modelName}`}
          subtitle={
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              {props.selectedDevice.soc.manufacturer} {props.selectedDevice.soc.name}
            </span>
          }
          onClear={() => {
            props.onDeviceSelect(null)
          }}
        />
      ) : (
        <>
          <Controller
            name={props.name}
            control={props.control}
            render={({ field }) => {
              // Store the field onChange function in ref for last used device functionality
              fieldOnChangeRef.current = field.onChange

              return (
                <Autocomplete<DeviceOption>
                  leftIcon={<MonitorSmartphone className="w-5 h-5" />}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value)
                    if (!value) {
                      props.onDeviceSelect(null)
                      return
                    }

                    props
                      .loadDeviceItems(props.deviceSearchTerm)
                      .then((devices) => {
                        const device = devices.find((d) => d.id === value)
                        if (device) {
                          props.onDeviceSelect(device)
                          setLastUsedDevice(device)
                        }
                      })
                      .catch((error) =>
                        logger.error(
                          `[DeviceSelector] loadDeviceItems for ${props.deviceSearchTerm}`,
                          error,
                        ),
                      )
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
              )
            }}
          />

          <LastUsedDeviceSelector
            lastUsedDevice={lastUsedDevice}
            onSelectLastUsedDevice={handleLastUsedDeviceSelect}
            isLoading={isLastUsedDeviceLoading}
          />
        </>
      )}

      {props.errorMessage && <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>}
    </div>
  )
}
