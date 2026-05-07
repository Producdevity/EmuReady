'use client'

import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form'
import { Autocomplete } from '@/components/ui'
import { readFieldError } from './readFieldError'

type FieldName<TValues extends FieldValues> =
  | FieldPathByValue<TValues, string>
  | FieldPathByValue<TValues, string | undefined>

interface Props<TValues extends FieldValues, TItem extends { id: string }> {
  control: Control<TValues>
  name: FieldName<TValues>
  errors: FieldErrors<TValues>
  label: string
  placeholder: string
  initial: TItem | null
  loadItems: (query: string) => Promise<TItem[]>
  optionToLabel: (item: TItem) => string
  minCharsToTrigger?: number
  clearAsUndefined?: boolean
}

export function AdminAutocompleteField<TValues extends FieldValues, TItem extends { id: string }>(
  props: Props<TValues, TItem>,
) {
  const errorMessage = readFieldError(props.errors, props.name)

  return (
    <div>
      <Controller
        name={props.name}
        control={props.control}
        render={({ field }) => (
          <Autocomplete<TItem>
            label={props.label}
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(value) =>
              field.onChange(props.clearAsUndefined && !value ? undefined : value)
            }
            items={props.initial ? [props.initial] : []}
            loadItems={props.loadItems}
            optionToValue={(item) => item.id}
            optionToLabel={props.optionToLabel}
            placeholder={props.placeholder}
            minCharsToTrigger={props.minCharsToTrigger ?? 1}
          />
        )}
      />
      {errorMessage ? (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  )
}
