import { LoadingSpinner, Pagination } from '@/components/ui'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  isPending: boolean
  error?: unknown
  visibility?: 'visible' | 'hidden'
  itemCount: number
  icon: LucideIcon
  emptyMessage: string
  errorMessage?: string
  pagination?: {
    page: number
    pages: number
    total: number
    limit: number
    onPageChange: (page: number) => void
  }
  children: ReactNode
}

function ModalListContent(props: Props) {
  const Icon = props.icon

  if (props.isPending) {
    return (
      <div className="flex-1 overflow-y-auto -mx-6 px-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (props.error) {
    return (
      <div className="flex-1 overflow-y-auto -mx-6 px-6">
        <div className="text-center py-8">
          <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {props.errorMessage ?? 'Failed to load. Please try again.'}
          </p>
        </div>
      </div>
    )
  }

  if (props.visibility === 'hidden') {
    return (
      <div className="flex-1 overflow-y-auto -mx-6 px-6">
        <div className="text-center py-8">
          <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">This list is private</p>
        </div>
      </div>
    )
  }

  if (props.visibility === 'visible' && props.itemCount === 0) {
    return (
      <div className="flex-1 overflow-y-auto -mx-6 px-6">
        <div className="text-center py-8">
          <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{props.emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto -mx-6 px-6">
        <div className="space-y-1">{props.children}</div>
      </div>

      {props.pagination && props.pagination.pages > 1 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            page={props.pagination.page}
            totalPages={props.pagination.pages}
            totalItems={props.pagination.total}
            itemsPerPage={props.pagination.limit}
            onPageChange={props.pagination.onPageChange}
          />
        </div>
      )}
    </>
  )
}

export default ModalListContent
