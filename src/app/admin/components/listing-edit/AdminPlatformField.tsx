'use client'

import { Controller, type Control, type FieldPathByValue, type FieldValues } from 'react-hook-form'
import { AdminPlatformSelector, type PlatformCompatibility } from './AdminPlatformSelector'

interface Props<TValues extends FieldValues> {
  control: Control<TValues>
  name: FieldPathByValue<TValues, string | null | undefined>
  compatibility: PlatformCompatibility
  label?: string
  error?: string
}

export function AdminPlatformField<TValues extends FieldValues>(props: Props<TValues>) {
  return (
    <div>
      <Controller
        control={props.control}
        name={props.name}
        render={({ field }) => (
          <AdminPlatformSelector
            label={props.label}
            compatibility={props.compatibility}
            value={typeof field.value === 'string' ? field.value : null}
            onChange={(platformId) => field.onChange(platformId)}
          />
        )}
      />
      {props.error ? <p className="mt-1 text-sm text-red-500">{props.error}</p> : null}
    </div>
  )
}
