import { type ReactNode } from 'react'
import { Controller, type Control } from 'react-hook-form'
import {
  type ValidationRules,
  type CustomFieldDefinitionWithOptions,
} from '@/app/listings/new/components/CustomFieldRenderer'
import { type ListingFormValues } from '@/app/listings/new/page'
import { Input } from '@/components/ui'
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

function CustomFieldTypeText(props: Props) {
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
        defaultValue=""
        rules={props.rules}
        render={({ field }) => (
          <Input
            className={cn(
              'mt-2',
              props.errorMessage &&
                'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500',
            )}
            id={props.fieldName}
            leftIcon={props.icon}
            value={field.value as string}
            onChange={(e) => field.onChange(e.target.value)}
            placeholder={`Enter ${props.fieldDef.label.toLowerCase()}`}
          />
        )}
      />
      {props.errorMessage && (
        <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>
      )}
    </div>
  )
}

export default CustomFieldTypeText
