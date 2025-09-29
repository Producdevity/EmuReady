import { type PropsWithChildren, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props extends PropsWithChildren {
  title: string
  description: string
  headerActions?: ReactNode
  className?: string
}

export function AdminPageLayout(props: Props) {
  return (
    <div className={cn('container mx-auto px-2 md:px-4 mb-8', props.className)}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{props.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{props.description}</p>
        </div>
        {props.headerActions && (
          <div className="flex flex-col lg:flex-row items-end gap-2">{props.headerActions}</div>
        )}
      </div>
      {props.children}
    </div>
  )
}
