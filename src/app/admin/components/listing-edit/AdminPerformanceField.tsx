'use client'

import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form'
import { SelectInput } from '@/components/ui'
import { api } from '@/lib/api'
import { readFieldError } from './readFieldError'

interface Props<TValues extends FieldValues> {
  control: Control<TValues>
  name: FieldPathByValue<TValues, number>
  errors: FieldErrors<TValues>
  label?: string
}

export function AdminPerformanceField<TValues extends FieldValues>(props: Props<TValues>) {
  const performanceScalesQuery = api.performanceScales.get.useQuery()
  const errorMessage = readFieldError(props.errors, props.name)
  const labelText = props.label ?? 'Performance Scale'

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {labelText} *
      </label>
      <Controller
        name={props.name}
        control={props.control}
        render={({ field }) => (
          <SelectInput
            label={labelText}
            hideLabel
            options={
              performanceScalesQuery.data?.map((scale) => ({
                id: scale.id.toString(),
                name: scale.label,
              })) ?? []
            }
            value={typeof field.value === 'number' ? field.value.toString() : ''}
            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
          />
        )}
      />
      {errorMessage ? (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  )
}
