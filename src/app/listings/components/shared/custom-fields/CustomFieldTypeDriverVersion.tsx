import { type ReactNode } from 'react'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { Autocomplete, type AutocompleteOptionBase } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useDriverVersions } from './hooks/useDriverVersions'

interface DriverReleaseOption extends AutocompleteOptionBase {
  label: string
  value: string
}

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

function CustomFieldTypeDriverVersion<
  TFieldValues extends FieldValues = FieldValues,
>(props: Props<TFieldValues>) {
  const driverVersions = useDriverVersions()
  const selectOptions: DriverReleaseOption[] = driverVersions?.data
    ? [
        { label: 'Select for Non-Android Device', value: 'N/A' },
        ...(driverVersions?.data ?? []),
      ]
    : []

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
        defaultValue={'' as TFieldValues[FieldPath<TFieldValues>]}
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
              props.fieldDef.placeholder ||
              `Enter ${props.fieldDef.label.toLowerCase()}`
            }
            className={cn(
              'w-full mt-2',
              props.errorMessage &&
                'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500',
            )}
            filterKeys={['name', 'label', 'value']}
          />
        )}
      />
      {props.errorMessage && (
        <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>
      )}
    </div>
  )
}

export default CustomFieldTypeDriverVersion
