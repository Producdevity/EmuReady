'use client'

import { useCallback, useMemo, type KeyboardEvent } from 'react'

interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showLabel?: boolean
}

function Pagination(props: Props) {
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
      Array.from({ length: props.totalPages }, (_, i) => i + 1).filter(
        (pageNum) => {
          // Show current page and 2 pages before and after
          const isNearCurrent =
            pageNum >= props.currentPage - 2 && pageNum <= props.currentPage + 2
          // Don't show page 1 in this section if we're showing it separately
          const isNotFirstPage = props.currentPage > 3 ? pageNum !== 1 : true
          // Don't show the last page in this section if we're showing it separately
          const isNotLastPage =
            props.currentPage < props.totalPages - 2
              ? pageNum !== props.totalPages
              : true

          return isNearCurrent && isNotFirstPage && isNotLastPage
        },
      ),
    [props.currentPage, props.totalPages],
  )

  if (props.totalPages <= 1) return null

  return (
    <nav className="mt-8" aria-label="Pagination navigation" role="navigation">
      {showLabel && (
        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 text-center">
          Page {props.currentPage} of {props.totalPages}
        </div>
      )}
      <div className="flex justify-center gap-2 flex-wrap">
        {/* Previous page button */}
        <button
          onClick={() => props.onPageChange(Math.max(1, props.currentPage - 1))}
          disabled={props.currentPage === 1}
          className={`px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            props.currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
          aria-label="Go to previous page"
        >
          &laquo;
        </button>

        {/* First page */}
        {props.currentPage > 3 && (
          <button
            onClick={() => props.onPageChange(1)}
            onKeyDown={(e) => handleKeyDown(e, 1)}
            className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Go to first page"
          >
            1
          </button>
        )}

        {/* Ellipsis before */}
        {props.currentPage > 4 && (
          <span className="px-3 py-1" aria-hidden="true">
            ...
          </span>
        )}

        {/* Pages around current */}
        {pagesAroundCurrent.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => props.onPageChange(pageNum)}
            onKeyDown={(e) => handleKeyDown(e, pageNum)}
            className={`px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              pageNum === props.currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
            }`}
            aria-label={`Go to page ${pageNum}`}
            aria-current={pageNum === props.currentPage ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ))}

        {/* Ellipsis after */}
        {props.currentPage < props.totalPages - 3 && (
          <span className="px-3 py-1" aria-hidden="true">
            ...
          </span>
        )}

        {/* Last page */}
        {props.currentPage < props.totalPages - 2 && (
          <button
            onClick={() => props.onPageChange(props.totalPages)}
            onKeyDown={(e) => handleKeyDown(e, props.totalPages)}
            className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Go to last page"
          >
            {props.totalPages}
          </button>
        )}

        {/* Next page button */}
        <button
          onClick={() =>
            props.onPageChange(
              Math.min(props.totalPages, props.currentPage + 1),
            )
          }
          disabled={props.currentPage === props.totalPages}
          className={`px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            props.currentPage === props.totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
          aria-label="Go to next page"
        >
          &raquo;
        </button>
      </div>
    </nav>
  )
}

export default Pagination
