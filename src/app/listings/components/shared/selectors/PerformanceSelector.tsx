'use client'

import { Zap } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { SelectInput } from '@/components/ui'
import { performanceColorMap, defaultPerformanceColor } from '@/data/styles'
import { cn } from '@/lib/utils'
import { SelectedItemCard } from '../SelectedItemCard'
import { type PerformanceScale } from '../types'

interface Props<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  performanceScalesData: PerformanceScale[] | undefined
  errorMessage?: string
}

export function PerformanceSelector<TFieldValues extends FieldValues = FieldValues>(
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

          const performanceColor =
            performanceColorMap[selectedPerformance?.rank ?? 0] ?? defaultPerformanceColor

          return (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Performance
              </label>

              {selectedPerformance ? (
                <SelectedItemCard
                  leftContent={
                    <div
                      className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center',
                        performanceColor,
                      )}
                    >
                      <Zap className="w-6 h-6" />
                    </div>
                  }
                  title={selectedPerformance.label}
                  subtitle={selectedPerformance.description ?? undefined}
                  onClear={() => {
                    field.onChange(undefined)
                  }}
                />
              ) : (
                <SelectInput
                  label=""
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
              )}
            </>
          )
        }}
      />
      {props.errorMessage && <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>}
    </div>
  )
}
