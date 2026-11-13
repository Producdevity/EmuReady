import { type ReactNode } from 'react'
import {
  Controller,
  type Control,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { cn } from '@/lib/utils'
import { type CustomFieldDefinition } from '@orm'
import { DriverVersionInput } from './DriverVersionInput'
import { useDriverVersions } from '../hooks/useDriverVersions'

interface Props<TFieldValues extends FieldValues> {
  fieldDef: Pick<CustomFieldDefinition, 'id' | 'name' | 'label' | 'isRequired'> &
    Partial<Pick<CustomFieldDefinition, 'placeholder'>>
  fieldName: FieldPath<TFieldValues>
  rules: NonNullable<ControllerProps<TFieldValues, FieldPath<TFieldValues>>['rules']>
  control: Control<TFieldValues>
  errorMessage?: string
  icon: ReactNode
}

export default function DriverVersionField<TFieldValues extends FieldValues>(
  props: Props<TFieldValues>,
) {
  const driverVersions = useDriverVersions()
  const helperMessage =
    driverVersions.errorMessage ??
    (driverVersions.rateLimited
      ? 'GitHub rate limit exceeded. Select a default option or enter a custom driver.'
      : null)

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
          <DriverVersionInput
            id={props.fieldName}
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            leftIcon={props.icon}
            placeholder={
              props.fieldDef.placeholder || `Enter ${props.fieldDef.label.toLowerCase()}`
            }
            className={cn(
              'w-full mt-2',
              props.errorMessage &&
                'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500',
            )}
            errorId={props.errorMessage ? `${props.fieldName}-error` : undefined}
            driverReleases={driverVersions.data}
          />
        )}
      />
      {driverVersions.loading && !driverVersions.data && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading driver versions…</p>
      )}
      {helperMessage && (
        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">{helperMessage}</p>
      )}
      {props.errorMessage && (
        <p id={`${props.fieldName}-error`} className="text-red-500 text-xs mt-1">
          {props.errorMessage}
        </p>
      )}
    </div>
  )
}
