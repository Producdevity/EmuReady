'use client'

import { Search } from 'lucide-react'

function SearchEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Search className="size-10 text-gray-300 dark:text-gray-600 mb-3" />
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
        No matching bookmarks found
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Try a different search term</p>
    </div>
  )
}

export default SearchEmptyState
