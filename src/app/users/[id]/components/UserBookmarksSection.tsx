'use client'

import { Monitor, Search, Smartphone } from 'lucide-react'
import { useState } from 'react'
import BookmarkGrid from '@/app/profile/components/bookmarks/BookmarkGrid'
import BookmarkSubTabButton from '@/app/profile/components/bookmarks/BookmarkSubTabButton'
import NoBookmarksMessage from '@/app/profile/components/bookmarks/NoBookmarksMessage'
import { Input } from '@/components/ui/form'
import { UI_CONSTANTS } from '@/data/constants'
import useDebouncedValue from '@/hooks/useDebouncedValue'

type SubTab = 'handheld' | 'pc'

interface Props {
  userId: string
  handheldCount: number
  pcCount: number
}

function UserBookmarksSection(props: Props) {
  const [subTab, setSubTab] = useState<SubTab>('handheld')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, UI_CONSTANTS.DEBOUNCE_DELAY)
  const limit = 12

  const handleSubTabChange = (tab: SubTab) => {
    setSubTab(tab)
    setPage(1)
    setSearch('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <BookmarkSubTabButton
            active={subTab === 'handheld'}
            count={props.handheldCount}
            icon={<Smartphone className="size-4" />}
            label="Handheld"
            onClick={() => handleSubTabChange('handheld')}
          />
          <BookmarkSubTabButton
            active={subTab === 'pc'}
            count={props.pcCount}
            icon={<Monitor className="size-4" />}
            label="PC"
            onClick={() => handleSubTabChange('pc')}
          />
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search by game title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
      </div>

      <BookmarkGrid
        variant={subTab}
        userId={props.userId}
        page={page}
        limit={limit}
        search={debouncedSearch}
        onPageChange={setPage}
        emptyContent={<NoBookmarksMessage />}
      />
    </div>
  )
}

export default UserBookmarksSection
