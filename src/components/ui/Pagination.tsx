'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useCallback, useMemo, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  currentPage: number
  totalPages: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange: (page: number) => void
  showLabel?: boolean
}

export function Pagination(props: Props) {
  const showLabel = props.showLabel ?? true
  const onPageChange = props.onPageChange

  const handleKeyDown = useCallback(
    (ev: KeyboardEvent, pageNum: number) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return

      ev.preventDefault()
      onPageChange(pageNum)
    },
    [onPageChange],
  )

  const pagesAroundCurrent = useMemo(
    () =>
      Array.from({ length: props.totalPages }, (_, i) => i + 1).filter((pageNum) => {
        // Use 2 as default for SSR compatibility, works well on both mobile and desktop
        const range = 2
        const isNearCurrent =
          pageNum >= props.currentPage - range && pageNum <= props.currentPage + range
        const isNotFirstPage = props.currentPage > range + 1 ? pageNum !== 1 : true
        const isNotLastPage =
          props.currentPage < props.totalPages - range ? pageNum !== props.totalPages : true

        return isNearCurrent && isNotFirstPage && isNotLastPage
      }),
    [props.currentPage, props.totalPages],
  )

  if (props.totalPages <= 1) return null

  // Calculate items per page from pagination data or fall back to reasonable default
  const itemsPerPage =
    props.itemsPerPage ??
    (props.totalItems && props.totalPages ? Math.ceil(props.totalItems / props.totalPages) : 10)

  const itemsStart = !props.totalItems ? 0 : (props.currentPage - 1) * itemsPerPage + 1

  const itemsEnd = !props.totalItems
    ? 0
    : Math.min(props.currentPage * itemsPerPage, props.totalItems)

  return (
    <nav className="mt-4" aria-label="Pagination navigation" role="navigation">
      <div className="flex flex-col items-center space-y-4">
        {showLabel && props.totalItems && (
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            <span className="hidden sm:inline">
              Showing{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{itemsStart}</span>{' '}
              to <span className="font-semibold text-gray-900 dark:text-gray-100">{itemsEnd}</span>{' '}
              of{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {props.totalItems}
              </span>{' '}
              results
            </span>
            <span className="sm:hidden">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {itemsStart}-{itemsEnd}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {props.totalItems}
              </span>
            </span>
          </div>
        )}

        <div className="flex items-center space-x-1">
          <button
            onClick={() => props.onPageChange(Math.max(1, props.currentPage - 1))}
            disabled={props.currentPage === 1}
            className={cn(
              'relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              props.currentPage === 1
                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md',
            )}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:ml-2 sm:inline">Previous</span>
          </button>

          {props.currentPage > 3 && (
            <>
              <button
                onClick={() => props.onPageChange(1)}
                onKeyDown={(e) => handleKeyDown(e, 1)}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                aria-label="Go to first page"
              >
                1
              </button>
              {props.currentPage > 4 && (
                <span
                  className="flex items-center px-2 py-2 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              )}
            </>
          )}

          {pagesAroundCurrent.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => props.onPageChange(pageNum)}
              onKeyDown={(e) => handleKeyDown(e, pageNum)}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                pageNum === props.currentPage
                  ? 'bg-blue-600 text-white shadow-lg ring-1 ring-blue-600 hover:bg-blue-700'
                  : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 shadow-sm hover:shadow-md'
              }`}
              aria-label={`Go to page ${pageNum}`}
              aria-current={pageNum === props.currentPage ? 'page' : undefined}
            >
              {pageNum}
            </button>
          ))}

          {props.currentPage < props.totalPages - 2 && (
            <>
              {props.currentPage < props.totalPages - 3 && (
                <span
                  className="flex items-center px-2 py-2 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              )}
              <button
                type="button"
                onClick={() => props.onPageChange(props.totalPages)}
                onKeyDown={(e) => handleKeyDown(e, props.totalPages)}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                aria-label="Go to last page"
              >
                {props.totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => props.onPageChange(Math.min(props.totalPages, props.currentPage + 1))}
            disabled={props.currentPage === props.totalPages}
            className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              props.currentPage === props.totalPages
                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md'
            }`}
            aria-label="Go to next page"
          >
            <span className="hidden sm:mr-2 sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {showLabel && (
          <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
            Page {props.currentPage} of {props.totalPages}
          </div>
        )}
      </div>
    </nav>
  )
}
