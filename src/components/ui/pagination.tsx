'use client'

import React, { useCallback } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showLabel?: boolean
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  showLabel = true
}: PaginationProps) {
  const handleKeyDown = useCallback((event: React.KeyboardEvent, pageNum: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onPageChange(pageNum)
    }
  }, [onPageChange])

  if (totalPages <= 1) return null

  return (
    <nav 
      className="mt-8" 
      aria-label="Pagination navigation"
      role="navigation"
    >
      {showLabel && (
        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 text-center">
          Page {currentPage} of {totalPages}
        </div>
      )}
      <div className="flex justify-center gap-2 flex-wrap">
        {/* Previous page button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
          aria-label="Go to previous page"
        >
          &laquo;
        </button>
        
        {/* First page */}
        {currentPage > 3 && (
          <button
            onClick={() => onPageChange(1)}
            onKeyDown={(e) => handleKeyDown(e, 1)}
            className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Go to first page"
          >
            1
          </button>
        )}
        
        {/* Ellipsis before */}
        {currentPage > 4 && <span className="px-3 py-1" aria-hidden="true">...</span>}
        
        {/* Pages around current */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((pageNum) => {
            // Show current page and 2 pages before and after
            const isNearCurrent = pageNum >= currentPage - 2 && pageNum <= currentPage + 2
            
            // Don't show page 1 in this section if we're showing it separately
            const isNotFirstPage = currentPage > 3 ? pageNum !== 1 : true
            
            // Don't show the last page in this section if we're showing it separately
            const isNotLastPage =
              currentPage < totalPages - 2 ? pageNum !== totalPages : true
            
            return isNearCurrent && isNotFirstPage && isNotLastPage
          })
          .map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              onKeyDown={(e) => handleKeyDown(e, pageNum)}
              className={`px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                pageNum === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
              }`}
              aria-label={`Go to page ${pageNum}`}
              aria-current={pageNum === currentPage ? "page" : undefined}
            >
              {pageNum}
            </button>
          ))}
        
        {/* Ellipsis after */}
        {currentPage < totalPages - 3 && <span className="px-3 py-1" aria-hidden="true">...</span>}
        
        {/* Last page */}
        {currentPage < totalPages - 2 && (
          <button
            onClick={() => onPageChange(totalPages)}
            onKeyDown={(e) => handleKeyDown(e, totalPages)}
            className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Go to last page"
          >
            {totalPages}
          </button>
        )}
        
        {/* Next page button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            currentPage === totalPages
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