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
  const shouldCenter = alignment === 'center'
  const gridTemplate = props.icon ? 'grid-cols-auto-value' : 'grid-cols-label-value'

  return (
    <div
      className={cn(
        'detail-field-grid grid w-full gap-x-3 gap-y-1',
        gridTemplate === 'grid-cols-auto-value'
          ? 'sm:grid-cols-[auto_1fr]'
          : 'grid-cols-1 sm:grid-cols-[max-content_1fr]',
      )}
    >
      {props.icon ? (
        <div className="flex items-start text-gray-500 dark:text-gray-400" aria-hidden="true">
          {props.icon}
        </div>
      ) : null}

      <dt
        className={cn(
          'text-sm font-semibold leading-snug text-gray-700 dark:text-gray-200',
          props.icon
            ? 'col-start-2 flex items-start'
            : shouldCenter
              ? 'flex items-center'
              : 'flex items-start',
        )}
      >
        <span className="flex items-center gap-1">
          {props.label}
          <span aria-hidden="true">:</span>
        </span>
      </dt>

      <dd
        className={cn(
          'text-sm leading-relaxed text-gray-600 dark:text-gray-300',
          props.icon
            ? 'col-start-2'
            : shouldCenter
              ? 'sm:flex sm:items-center'
              : 'sm:flex sm:items-start',
        )}
      >
        {props.value}
      </dd>
    </div>
  )
}
