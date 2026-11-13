'use client'

import { Bookmark } from 'lucide-react'

function NoBookmarksMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
        <Bookmark className="size-8 text-amber-400" />
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No bookmarks to show</p>
      <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-500">
        This user hasn&apos;t bookmarked any compatibility reports yet
      </p>
    </div>
  )
}

export default NoBookmarksMessage
