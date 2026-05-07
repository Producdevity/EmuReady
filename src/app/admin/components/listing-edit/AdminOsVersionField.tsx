'use client'

import {
  type FieldErrors,
  type FieldPathByValue,
  type FieldValues,
  type UseFormRegister,
} from 'react-hook-form'
import { Input } from '@/components/ui'
import { readFieldError } from './readFieldError'

interface Props<TValues extends FieldValues> {
  register: UseFormRegister<TValues>
  name: FieldPathByValue<TValues, string>
  errors: FieldErrors<TValues>
}

export function AdminOsVersionField<TValues extends FieldValues>(props: Props<TValues>) {
  const error = readFieldError(props.errors, props.name)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        OS Version *
      </label>
      <Input
        {...props.register(props.name)}
        placeholder="e.g., Windows 11 24H2"
        className="w-full"
      />
      {error ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  )
}
