import { type ReactNode } from 'react'
import { Controller, type Control } from 'react-hook-form'
import {
  type ValidationRules,
  type CustomFieldDefinitionWithOptions,
} from '@/app/listings/new/components/CustomFieldRenderer'
import { type ListingFormValues } from '@/app/listings/new/page'
import { SelectInput } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Props {
  fieldDef: CustomFieldDefinitionWithOptions
  fieldName: `customFieldValues.${number}.value`
  index: number
  rules: ValidationRules
  control: Control<ListingFormValues>
  errorMessage: string | undefined
  icon: ReactNode
}

function CustomFieldTypeSelect(props: Props) {
  return (
    <div key={props.fieldDef.id} className="mb-4">
      <label
        htmlFor={props.fieldName}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {props.fieldDef.label} {props.fieldDef.isRequired && '*'}
      </label>
      <Controller
        name={props.fieldName}
        control={props.control}
        defaultValue={props.fieldDef.parsedOptions?.[0]?.value ?? ''}
        rules={props.rules}
        render={({ field }) => (
          <SelectInput
            label={props.fieldDef.label}
            leftIcon={props.icon}
            className={cn(
              props.errorMessage &&
                'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500',
            )}
            options={
              props.fieldDef.parsedOptions?.map((opt) => ({
                id: opt.value,
                name: opt.label,
              })) ?? []
            }
            value={field.value as string}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />
      {props.errorMessage && (
        <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>
      )}
    </div>
  )
}

export default CustomFieldTypeSelect
