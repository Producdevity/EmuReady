import { type PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

interface Props extends PropsWithChildren {
  className?: string
}

export function Card(props: Props) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', props.className)}>
      {props.children}
    </div>
  )
}
