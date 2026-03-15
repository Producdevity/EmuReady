'use client'

import { Bookmark } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

interface Props {
  listingType: string
  browseHref: string
}

function BookmarkEmptyState(props: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
        <Bookmark className="size-8 text-amber-400" />
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
        No {props.listingType} bookmarks yet
      </p>
      <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-500">
        Bookmark compatibility reports to save them here for quick access later
      </p>
      <Button variant="outline" size="sm" className="mt-4" asChild>
        <Link href={props.browseHref}>Browse {props.listingType} reports</Link>
      </Button>
    </div>
  )
}

export default BookmarkEmptyState
