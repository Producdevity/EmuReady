'use client'

import { type Control, type FieldErrors, type FieldValues } from 'react-hook-form'
import { renderCustomField } from '@/app/listings/components/shared'
import { type RouterOutput } from '@/types/trpc'

type CustomFieldDefinition = RouterOutput['customFieldDefinitions']['getByEmulator'][number]

interface Props<TValues extends FieldValues> {
  fieldDefinitions: CustomFieldDefinition[]
  control: Control<TValues>
  errors: FieldErrors<TValues>
  title?: string
}

export function AdminCustomFieldsSection<TValues extends FieldValues>(props: Props<TValues>) {
  if (props.fieldDefinitions.length === 0) return null

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {props.title ?? 'Custom Fields for Selected Emulator'}
      </h3>
      <div className="space-y-4">
        {props.fieldDefinitions.map((fieldDef, index) =>
          renderCustomField({
            fieldDef,
            index,
            control: props.control,
            formErrors: props.errors,
          }),
        )}
      </div>
    </div>
  )
}
