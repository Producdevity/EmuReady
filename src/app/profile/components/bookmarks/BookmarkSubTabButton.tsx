'use client'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface Props {
  active: boolean
  count: number
  icon: ReactNode
  label: string
  onClick: () => void
}

function BookmarkSubTabButton(props: Props) {
  return (
    <Button
      variant={props.active ? 'default' : 'ghost'}
      size="sm"
      onClick={props.onClick}
      className={cn('gap-2', props.active && 'shadow-sm')}
    >
      {props.icon}
      {props.label}
      <span
        className={cn(
          'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full',
          props.active
            ? 'bg-white/20 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        )}
      >
        {props.count}
      </span>
    </Button>
  )
}

export default BookmarkSubTabButton
