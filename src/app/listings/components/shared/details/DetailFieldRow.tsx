'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DetailFieldRowProps {
  icon?: ReactNode
  label: ReactNode
  value: ReactNode
  align?: 'start' | 'center'
}

export function DetailFieldRow(props: DetailFieldRowProps) {
  const alignment = props.align ?? 'start'

  return (
    <div
      className={cn(
        'flex flex-wrap items-start gap-3',
        props.icon ? null : alignment === 'center' ? 'sm:items-center' : 'sm:items-start',
      )}
    >
      {props.icon ? (
        <div className="flex items-start text-gray-500 dark:text-gray-400">{props.icon}</div>
      ) : null}

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-wrap items-start gap-y-1 gap-x-2 text-sm',
          alignment === 'center' ? 'sm:items-center' : 'sm:items-start',
        )}
      >
        <dt className="shrink-0 font-semibold text-gray-700 dark:text-gray-200 leading-snug after:ml-1 after:content-[':']">
          {props.label}
        </dt>
        <dd className="min-w-0 flex-1 text-gray-600 dark:text-gray-300 break-words text-pretty leading-relaxed">
          {props.value}
        </dd>
      </div>
    </div>
  )
}
