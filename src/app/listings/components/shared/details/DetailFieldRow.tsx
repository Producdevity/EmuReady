'use client'

import { type ReactNode } from 'react'

interface DetailFieldRowProps {
  icon?: ReactNode
  label: ReactNode
  value: ReactNode
}

export function DetailFieldRow(props: DetailFieldRowProps) {
  return (
    <div className="detail-field-grid grid w-full gap-y-1 grid-cols-1">
      {props.icon ? (
        <div className="flex items-start text-gray-500 dark:text-gray-400" aria-hidden="true">
          {props.icon}
        </div>
      ) : null}

      <dt className="text-sm font-semibold leading-snug text-gray-700 dark:text-gray-200 flex items-start">
        <span className="flex items-center gap-1">
          {props.label}
          <span aria-hidden="true">:</span>
        </span>
      </dt>

      <dd className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 flex items-start">
        {props.value}
      </dd>
    </div>
  )
}
