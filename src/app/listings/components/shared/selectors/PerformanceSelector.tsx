'use client'

import { Zap } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { SelectInput } from '@/components/ui'

export interface PerformanceScale {
  id: number
  label: string
  rank: number
  description: string | null
}

interface Props<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  performanceScalesData: PerformanceScale[] | undefined
  errorMessage?: string
}

function PerformanceSelector<TFieldValues extends FieldValues = FieldValues>(
  props: Props<TFieldValues>,
) {
  return (
    <div>
      <Controller
        name={props.name}
        control={props.control}
        render={({ field }) => {
          const selectedPerformance = props.performanceScalesData?.find(
            (p) => p.id === Number(field.value),
          )

          return (
            <>
              <SelectInput
                label="Performance"
                leftIcon={<Zap className="w-5 h-5" />}
                options={
                  props.performanceScalesData?.map((p) => ({
                    id: String(p.id),
                    name: p.label,
                  })) ?? []
                }
                value={String(field.value ?? '')}
                onChange={(ev) => field.onChange(Number(ev.target.value))}
              />
              {selectedPerformance?.description && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-medium">
                      {selectedPerformance.label}:
                    </span>{' '}
                    {selectedPerformance.description}
                  </p>
                </div>
              )}
            </>
          )
        }}
      />
      {props.errorMessage && (
        <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>
      )}
    </div>
  )
}

export default PerformanceSelector
