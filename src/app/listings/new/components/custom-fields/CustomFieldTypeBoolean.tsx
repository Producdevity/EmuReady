import { type ReactNode } from 'react'
import { Controller, type Control } from 'react-hook-form'
import {
  type ValidationRules,
  type CustomFieldDefinitionWithOptions,
} from '@/app/listings/new/components/CustomFieldRenderer'
import { type ListingFormValues } from '@/app/listings/new/page'

interface Props {
  fieldDef: CustomFieldDefinitionWithOptions
  fieldName: `customFieldValues.${number}.value`
  index: number
  rules: ValidationRules
  control: Control<ListingFormValues>
  errorMessage: string | undefined
  icon: ReactNode
}

function CustomFieldTypeBoolean(props: Props) {
  return (
    <div key={props.fieldDef.id} className="mb-4">
      <Controller
        name={props.fieldName}
        control={props.control}
        defaultValue={false}
        render={({ field }) => (
          <label
            htmlFor={props.fieldName}
            className="flex items-center cursor-pointer"
          >
            <input
              type="checkbox"
              id={props.fieldName}
              checked={field.value as boolean}
              onChange={(e) => field.onChange(e.target.checked)}
              className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              {props.icon}
              <span className="ml-2">
                {props.fieldDef.label} {props.fieldDef.isRequired && '*'}
              </span>
            </span>
          </label>
        )}
      />
      {props.errorMessage && (
        <p className="text-red-500 text-xs mt-1 ml-6">{props.errorMessage}</p>
      )}
    </div>
  )
}

export default CustomFieldTypeBoolean
