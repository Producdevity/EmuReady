'use client'

import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form'
import { SelectInput } from '@/components/ui'
import { PC_OS_OPTIONS, isPcOs } from '@/data/pc-os'
import { type PcOs } from '@orm'
import { readFieldError } from './readFieldError'

interface Props<TValues extends FieldValues> {
  control: Control<TValues>
  name: FieldPathByValue<TValues, PcOs | null>
  errors: FieldErrors<TValues>
}

const LABEL = 'Operating System'
const EMPTY_LABEL = 'No OS recorded'

export function AdminOsField<TValues extends FieldValues>(props: Props<TValues>) {
  const error = readFieldError(props.errors, props.name)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {LABEL}
      </label>
      <Controller
        name={props.name}
        control={props.control}
        render={({ field }) => (
          <SelectInput
            label={LABEL}
            hideLabel
            emptyLabel={EMPTY_LABEL}
            options={PC_OS_OPTIONS.map((opt) => ({ id: opt.value, name: opt.label }))}
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(e) => {
              const next = e.target.value
              if (next === '') field.onChange(null)
              else if (isPcOs(next)) field.onChange(next)
            }}
          />
        )}
      />
      {error ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  )
}
