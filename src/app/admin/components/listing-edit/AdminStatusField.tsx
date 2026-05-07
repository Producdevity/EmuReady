'use client'

import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form'
import { SelectInput } from '@/components/ui'
import { APPROVAL_STATUS_OPTIONS, isApprovalStatus } from '@/data/approval-status'
import { type ApprovalStatus } from '@orm'
import { readFieldError } from './readFieldError'

interface Props<TValues extends FieldValues> {
  control: Control<TValues>
  name: FieldPathByValue<TValues, ApprovalStatus>
  errors: FieldErrors<TValues>
  label?: string
}

export function AdminStatusField<TValues extends FieldValues>(props: Props<TValues>) {
  const errorMessage = readFieldError(props.errors, props.name)
  const labelText = props.label ?? 'Status'

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
            options={APPROVAL_STATUS_OPTIONS}
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(e) => {
              if (isApprovalStatus(e.target.value)) field.onChange(e.target.value)
            }}
          />
        )}
      />
      {errorMessage ? (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  )
}
