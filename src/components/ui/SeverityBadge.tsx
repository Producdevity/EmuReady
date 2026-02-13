'use client'

import { type PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'
import { type Severity } from '@/schemas/common'

export type { Severity }

const severityClasses: Record<Severity, string> = {
  low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

interface Props extends PropsWithChildren {
  severity: Severity
  className?: string
}

export function SeverityBadge(props: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        severityClasses[props.severity],
        props.className,
      )}
    >
      {props.children}
    </span>
  )
}
