'use client'

import { Bookmark, Monitor, Search, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/form'
import { UI_CONSTANTS } from '@/data/constants'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { api } from '@/lib/api'
import BookmarkEmptyState from './bookmarks/BookmarkEmptyState'
import BookmarkGrid from './bookmarks/BookmarkGrid'
import BookmarkSubTabButton from './bookmarks/BookmarkSubTabButton'
import PrivacyNote from './bookmarks/PrivacyNote'
import SettingsSection from './SettingsSection'

type SubTab = 'handheld' | 'pc'

interface Props {
  userId: string
}

function BookmarksManager(props: Props) {
  const [subTab, setSubTab] = useState<SubTab>('handheld')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, UI_CONSTANTS.DEBOUNCE_DELAY)
  const limit = 12

  const countsQuery = api.bookmarks.getCounts.useQuery({ userId: props.userId })

  const handleSubTabChange = (tab: SubTab) => {
    setSubTab(tab)
    setPage(1)
    setSearch('')
  }

  const handheldCount =
    countsQuery.data?.visibility === 'visible' ? countsQuery.data.counts.listingBookmarks : 0
  const pcCount =
    countsQuery.data?.visibility === 'visible' ? countsQuery.data.counts.pcListingBookmarks : 0

  return (
    <SettingsSection
      title="Bookmarks"
      description="Your saved compatibility reports for quick access"
      icon={<Bookmark className="w-6 h-6" />}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <BookmarkSubTabButton
              active={subTab === 'handheld'}
              count={handheldCount}
              icon={<Smartphone className="size-4" />}
              label="Handheld"
              onClick={() => handleSubTabChange('handheld')}
            />
            <BookmarkSubTabButton
              active={subTab === 'pc'}
              count={pcCount}
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

        <PrivacyNote />

        <BookmarkGrid
          variant={subTab}
          userId={props.userId}
          page={page}
          limit={limit}
          search={debouncedSearch}
          onPageChange={setPage}
          emptyContent={
            <BookmarkEmptyState
              listingType={subTab === 'handheld' ? 'handheld' : 'PC'}
              browseHref={subTab === 'handheld' ? '/listings' : '/pc-listings'}
            />
          }
        />
      </div>
    </SettingsSection>
  )
}

export default BookmarksManager
