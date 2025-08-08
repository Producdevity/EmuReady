import { BookDashed, type LucideIcon } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  hasQuery: boolean
}

export function AdminTableNoResults(props: Props) {
  const Icon = props.icon || BookDashed
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-lg">
        {props.hasQuery ? 'No results found matching your search criteria.' : 'No results.'}
      </p>
    </div>
  )
}
