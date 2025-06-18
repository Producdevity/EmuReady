import { type ReactNode } from 'react'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

interface CustomFieldDefinitionWithOptions {
  id: string
  name: string
  label: string
  isRequired: boolean
  defaultValue?: string | number | boolean | null
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

function CustomFieldTypeBoolean<TFieldValues extends FieldValues = FieldValues>(
  props: Props<TFieldValues>,
) {
  // Use the actual default value from the field definition, fallback to false if null/undefined
  const defaultValue =
    props.fieldDef.defaultValue !== null &&
    props.fieldDef.defaultValue !== undefined
      ? Boolean(props.fieldDef.defaultValue)
      : false

  return (
    <div key={props.fieldDef.id} className="mb-4">
      <Controller
        name={props.fieldName}
        control={props.control}
        defaultValue={defaultValue as TFieldValues[FieldPath<TFieldValues>]}
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
