import { type PropsWithChildren, type ReactNode } from 'react'

interface Props extends PropsWithChildren {
  title: string
  description: string
  headerActions?: ReactNode
  className?: string
}

export function AdminPageLayout(props: Props) {
  return (
    <div
      className={`container mx-auto px-2 md:px-4 py-8 ${props.className || ''}`}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {props.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {props.description}
          </p>
        </div>
        {props.headerActions && (
          <div className="flex flex-col items-end gap-2">
            {props.headerActions}
          </div>
        )}
      </div>
      {props.children}
    </div>
  )
}
