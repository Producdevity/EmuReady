'use client'

import React from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid'

export type SortDirection = 'asc' | 'desc' | null

interface SortableHeaderProps {
  label: string
  field: string
  currentSortField: string | null
  currentSortDirection: SortDirection
  onSort: (field: string) => void
  className?: string
}

export function SortableHeader({
  label,
  field,
  currentSortField,
  currentSortDirection,
  onSort,
  className = ''
}: SortableHeaderProps) {
  const isActive = currentSortField === field
  
  return (
    <th 
      className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none group ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <div className="flex flex-col opacity-70">
          {isActive && currentSortDirection === 'asc' ? (
            <ChevronUpIcon className="w-4 h-4 text-blue-500" />
          ) : isActive && currentSortDirection === 'desc' ? (
            <ChevronDownIcon className="w-4 h-4 text-blue-500" />
          ) : (
            <div className="opacity-0 group-hover:opacity-50 transition-opacity">
              <ChevronUpIcon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </th>
  )
} 