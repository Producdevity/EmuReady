import { BookDashed, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  icon?: LucideIcon
  hasQuery: boolean
  title?: string
  queryTitle?: string
  description?: string
  queryDescription?: string
  action?: ReactNode
}

export function AdminTableNoResults(props: Props) {
  const Icon = props.icon || BookDashed
  const title = props.hasQuery
    ? (props.queryTitle ?? 'No results found matching your search criteria.')
    : (props.title ?? 'No results.')
  const description = props.hasQuery ? props.queryDescription : props.description

  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-lg">{title}</p>
      {description && (
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{description}</p>
      )}
      {props.action && <div className="mt-4">{props.action}</div>}
    </div>
  )
}
