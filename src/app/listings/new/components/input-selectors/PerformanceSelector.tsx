'use client'

import { Zap } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { type Control } from 'react-hook-form'
import { SelectInput } from '@/components/ui'
import { type RouterInput } from '@/types/trpc'

type ListingFormValues = RouterInput['listings']['create']

interface PerformanceScale {
  id: number
  label: string
  rank: number
  description: string | null
}

interface Props {
  control: Control<ListingFormValues>
  performanceScalesData: PerformanceScale[] | undefined
  errorMessage?: string
}

function PerformanceSelector(props: Props) {
  return (
    <div>
      <Controller
        name="performanceId"
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
