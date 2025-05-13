'use client'

import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center gap-2 mt-8">
      {/* First page */}
      {currentPage > 3 && (
        <button
          onClick={() => onPageChange(1)}
          className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          1
        </button>
      )}
      
      {/* Ellipsis before */}
      {currentPage > 4 && <span className="px-3 py-1">...</span>}
      
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
            className={`px-3 py-1 rounded-md ${
              pageNum === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
            }`}
          >
            {pageNum}
          </button>
        ))}
      
      {/* Ellipsis after */}
      {currentPage < totalPages - 3 && <span className="px-3 py-1">...</span>}
      
      {/* Last page */}
      {currentPage < totalPages - 2 && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          {totalPages}
        </button>
      )}
    </div>
  )
} 