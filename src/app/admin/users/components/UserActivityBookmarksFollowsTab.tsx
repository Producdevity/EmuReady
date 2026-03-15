'use client'

import { Bookmark, Gamepad2, Monitor, Search } from 'lucide-react'
import { useState } from 'react'
import GameFollowRow from '@/components/game-follows/GameFollowRow'
import { Input, LoadingSpinner, Pagination, UnderlineTabBar } from '@/components/ui'
import { UI_CONSTANTS } from '@/data/constants'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import BookmarkRow from './BookmarkRow'
import UserActivityMiniStat from './UserActivityMiniStat'

type ListSection = 'listingBookmarks' | 'pcBookmarks' | 'gameFollows'

const ITEMS_PER_PAGE = 10

const EMPTY_MESSAGES: Record<ListSection, string> = {
  listingBookmarks: 'No listing bookmarks',
  pcBookmarks: 'No PC listing bookmarks',
  gameFollows: 'Not following any games',
}

interface Props {
  userId: string
}

function UserActivityBookmarksFollowsTab(props: Props) {
  const [activeSection, setActiveSection] = useState<ListSection>('listingBookmarks')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, UI_CONSTANTS.DEBOUNCE_DELAY)

  const bookmarkCountsQuery = api.bookmarks.getCounts.useQuery({ userId: props.userId })
  const gameFollowCountQuery = api.gameFollows.getGameFollowCount.useQuery({ userId: props.userId })

  const listingBookmarksQuery = api.bookmarks.getListingBookmarks.useQuery(
    { userId: props.userId, page, limit: ITEMS_PER_PAGE, search: debouncedSearch || undefined },
    { enabled: activeSection === 'listingBookmarks', placeholderData: (previous) => previous },
  )

  const pcBookmarksQuery = api.bookmarks.getPcListingBookmarks.useQuery(
    { userId: props.userId, page, limit: ITEMS_PER_PAGE, search: debouncedSearch || undefined },
    { enabled: activeSection === 'pcBookmarks', placeholderData: (previous) => previous },
  )

  const gameFollowsQuery = api.gameFollows.getFollowedGames.useQuery(
    { userId: props.userId, page, limit: ITEMS_PER_PAGE, search: debouncedSearch || undefined },
    { enabled: activeSection === 'gameFollows', placeholderData: (previous) => previous },
  )

  const listingBookmarkCount =
    bookmarkCountsQuery.data?.visibility === 'visible'
      ? bookmarkCountsQuery.data.counts.listingBookmarks
      : 0
  const pcBookmarkCount =
    bookmarkCountsQuery.data?.visibility === 'visible'
      ? bookmarkCountsQuery.data.counts.pcListingBookmarks
      : 0
  const gameFollowCount =
    gameFollowCountQuery.data?.visibility === 'visible'
      ? gameFollowCountQuery.data.counts.followedGames
      : 0

  const sections: { id: ListSection; label: string; count: number; icon: typeof Bookmark }[] = [
    { id: 'listingBookmarks', label: 'Handheld', count: listingBookmarkCount, icon: Bookmark },
    { id: 'pcBookmarks', label: 'PC', count: pcBookmarkCount, icon: Monitor },
    { id: 'gameFollows', label: 'Games', count: gameFollowCount, icon: Gamepad2 },
  ]

  function handleSectionChange(section: ListSection) {
    setActiveSection(section)
    setSearch('')
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const activeQuery =
    activeSection === 'listingBookmarks'
      ? listingBookmarksQuery
      : activeSection === 'pcBookmarks'
        ? pcBookmarksQuery
        : gameFollowsQuery

  const activeData = activeQuery.data

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <UserActivityMiniStat
          label="Handheld Bookmarks"
          value={listingBookmarkCount}
          icon={<Bookmark className="w-3.5 h-3.5 text-amber-500" />}
        />
        <UserActivityMiniStat
          label="PC Bookmarks"
          value={pcBookmarkCount}
          icon={<Monitor className="w-3.5 h-3.5 text-blue-500" />}
        />
        <UserActivityMiniStat
          label="Games Followed"
          value={gameFollowCount}
          icon={<Gamepad2 className="w-3.5 h-3.5 text-green-500" />}
        />
      </div>

      <UnderlineTabBar
        tabs={sections}
        activeTab={activeSection}
        onTabChange={(id) => handleSectionChange(id as ListSection)}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by game title..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 h-8 text-xs"
        />
      </div>

      <div
        className={cn('min-h-[100px]', activeQuery.isFetching && 'opacity-60 transition-opacity')}
      >
        {activeQuery.isPending ? (
          <div className="flex items-center justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : activeData?.visibility === 'visible' && activeData.items.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {debouncedSearch
                ? `No results for "${debouncedSearch}"`
                : EMPTY_MESSAGES[activeSection]}
            </p>
          </div>
        ) : activeData?.visibility === 'visible' ? (
          <div className="space-y-1">
            {activeSection === 'listingBookmarks' &&
              listingBookmarksQuery.data?.visibility === 'visible' &&
              listingBookmarksQuery.data.items.map((item) => (
                <BookmarkRow key={item.id} variant="handheld" item={item} />
              ))}
            {activeSection === 'pcBookmarks' &&
              pcBookmarksQuery.data?.visibility === 'visible' &&
              pcBookmarksQuery.data.items.map((item) => (
                <BookmarkRow key={item.id} variant="pc" item={item} />
              ))}
            {activeSection === 'gameFollows' &&
              gameFollowsQuery.data?.visibility === 'visible' &&
              gameFollowsQuery.data.items.map((item) => (
                <GameFollowRow key={item.id} item={item} />
              ))}
          </div>
        ) : null}

        {activeData?.visibility === 'visible' && activeData.pagination.pages > 1 && (
          <div className="mt-3">
            <Pagination
              page={page}
              totalPages={activeData.pagination.pages}
              totalItems={activeData.pagination.total}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default UserActivityBookmarksFollowsTab
