import { type ReactNode } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Autocomplete, type AutocompleteOptionBase } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type DriverRelease, useDriverVersions } from './hooks/useDriverVersions'

interface DriverPlaceholderOption extends AutocompleteOptionBase {
  label: string
  value: string
  name?: string
}

type DriverReleaseOption = DriverRelease | DriverPlaceholderOption

interface CustomFieldDefinitionWithOptions {
  id: string
  name: string
  label: string
  isRequired: boolean
  placeholder?: string | null
}

interface ValidationRules {
  required: string | boolean
  validate?: (value: unknown) => boolean | string
}

interface Props<TFieldValues extends FieldValues = FieldValues> {
  fieldDef: CustomFieldDefinitionWithOptions
  fieldName: FieldPath<TFieldValues>
  index: number
  rules: ValidationRules
  control: Control<TFieldValues>
  errorMessage: string | undefined
  icon: ReactNode
}

function CustomFieldTypeDriverVersion<TFieldValues extends FieldValues = FieldValues>(
  props: Props<TFieldValues>,
) {
  const driverVersions = useDriverVersions()

  const baseOptions: DriverReleaseOption[] = [
    {
      label: 'Select for Non-Android Device',
      value: 'N/A',
      name: 'Select for Non-Android Device',
    },
    {
      label: 'Default System Driver',
      value: 'Default System Driver',
      name: 'Default System Driver',
    },
  ]

  const selectOptions: DriverReleaseOption[] = driverVersions.data
    ? [...baseOptions, ...driverVersions.data]
    : baseOptions

  const helperMessage = driverVersions.errorMessage
    ? driverVersions.errorMessage
    : driverVersions.rateLimited
      ? 'GitHub rate limit exceeded. Please try again in a few minutes or select a default option.'
      : null

  return (
    <div key={props.fieldDef.id} className="mb-4">
      <label
        htmlFor={props.fieldName}
        className="pl-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {props.fieldDef.label} {props.fieldDef.isRequired && '*'}
      </label>
      <Controller
        name={props.fieldName}
        control={props.control}
        rules={props.rules}
        render={({ field }) => (
          <Autocomplete<DriverReleaseOption>
            id={props.fieldName}
            value={field.value as string}
            onChange={(value) => field.onChange(value ?? '')}
            items={selectOptions}
            leftIcon={props.icon}
            optionToValue={(driverVersion) => driverVersion.value}
            optionToLabel={(driverVersion) => driverVersion.label}
            placeholder={
              props.fieldDef.placeholder || `Enter ${props.fieldDef.label.toLowerCase()}`
            }
            className={cn(
              'w-full mt-2',
              props.errorMessage &&
                'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500',
            )}
            filterKeys={['name', 'label', 'value']}
            disabled={driverVersions.loading && !driverVersions.data}
          />
        )}
      />
      {driverVersions.loading && !driverVersions.data && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading driver versions…</p>
      )}
      {helperMessage && (
        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">{helperMessage}</p>
      )}
      {props.errorMessage && <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>}
    </div>
  )
}

export default CustomFieldTypeDriverVersion
