'use client'

import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form'
import { readFieldError } from './readFieldError'

interface Props<TValues extends FieldValues> {
  control: Control<TValues>
  name: FieldPathByValue<TValues, string | null | undefined>
  errors: FieldErrors<TValues>
  label?: string
  rows?: number
  placeholder?: string
}

export function AdminNotesField<TValues extends FieldValues>(props: Props<TValues>) {
  const errorMessage = readFieldError(props.errors, props.name)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {props.label ?? 'Notes'}
      </label>
      <Controller
        name={props.name}
        control={props.control}
        render={({ field }) => (
          <textarea
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            rows={props.rows ?? 4}
            placeholder={props.placeholder ?? 'Additional notes about this listing...'}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        )}
      />
      {errorMessage ? (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  )
}
