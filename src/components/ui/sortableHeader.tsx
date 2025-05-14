'use client'

import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid'

type SortDirection = 'asc' | 'desc' | null

interface Props {
  label: string
  field: string
  currentSortField: string | null
  currentSortDirection: SortDirection
  onSort: (field: string) => void
  className?: string
}

function SortableHeader(props: Props) {
  const isActive = props.currentSortField === props.field

  return (
    <th
      className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none group ${props.className ?? ''}`}
      onClick={() => props.onSort(props.field)}
    >
      <div className="flex items-center gap-1">
        <span>{props.label}</span>
        <div className="flex flex-col opacity-70">
          {isActive && props.currentSortDirection === 'asc' ? (
            <ChevronUpIcon className="w-4 h-4 text-blue-500" />
          ) : isActive && props.currentSortDirection === 'desc' ? (
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

export default SortableHeader
