'use client'

import { Users, UserPlus, UserCheck, Ban, ShieldBan, Clock, Search } from 'lucide-react'
import { useState } from 'react'
import { Input, LoadingSpinner, Pagination, UnderlineTabBar } from '@/components/ui'
import { UI_CONSTANTS } from '@/data/constants'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { type RouterOutput } from '@/types/trpc'
import SocialUserRow from './SocialUserRow'
import UserActivityMiniStat from './UserActivityMiniStat'

type SocialOverview = RouterOutput['users']['getSocialOverview']

type ListSection = 'followers' | 'following' | 'friends' | 'blocked'

const ITEMS_PER_PAGE = 10

const EMPTY_MESSAGES: Record<ListSection, string> = {
  followers: 'No followers',
  following: 'Not following anyone',
  friends: 'No friends',
  blocked: 'No blocked users',
}

interface Props {
  data: SocialOverview
  userId: string
  isFetching: boolean
}

// Thresholds: 10+ amber (elevated activity), 50+ red (potential spam)
function getRateColor(value: number): string {
  if (value >= 50) return 'text-red-600 dark:text-red-400'
  if (value >= 10) return 'text-amber-600 dark:text-amber-400'
  return 'text-gray-900 dark:text-white'
}

function getRateBg(value: number): string {
  if (value >= 50) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  if (value >= 10) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
  return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
}

const RATE_INDICATORS = [
  { key: 'followsSentLast24h', label: 'Follows sent (24h)' },
  { key: 'followsSentLast7d', label: 'Follows sent (7d)' },
  { key: 'followsReceivedLast24h', label: 'Follows received (24h)' },
  { key: 'followsReceivedLast7d', label: 'Follows received (7d)' },
  { key: 'friendRequestsSentLast24h', label: 'Friend reqs (24h)' },
  { key: 'friendRequestsSentLast7d', label: 'Friend reqs (7d)' },
] as const

function UserActivitySocialTab(props: Props) {
  const [activeSection, setActiveSection] = useState<ListSection>('followers')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, UI_CONSTANTS.DEBOUNCE_DELAY)

  const listQuery = api.users.adminGetSocialList.useQuery(
    {
      userId: props.userId,
      section: activeSection,
      search: debouncedSearch || undefined,
      page,
      limit: ITEMS_PER_PAGE,
    },
    { placeholderData: (previous) => previous },
  )

  function handleSectionChange(section: ListSection) {
    setActiveSection(section)
    setSearch('')
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const sections: { id: ListSection; label: string; count: number; icon: typeof Users }[] = [
    { id: 'followers', label: 'Followers', count: props.data.counts.followers, icon: Users },
    { id: 'following', label: 'Following', count: props.data.counts.following, icon: UserPlus },
    { id: 'friends', label: 'Friends', count: props.data.counts.friends, icon: UserCheck },
    { id: 'blocked', label: 'Blocked', count: props.data.counts.blocking, icon: Ban },
  ]

  return (
    <div className={cn('space-y-4', props.isFetching && 'opacity-60 transition-opacity')}>
      {/* Counts Overview */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        <UserActivityMiniStat
          label="Followers"
          value={props.data.counts.followers}
          icon={<Users className="w-3.5 h-3.5 text-blue-500" />}
        />
        <UserActivityMiniStat
          label="Following"
          value={props.data.counts.following}
          icon={<UserPlus className="w-3.5 h-3.5 text-green-500" />}
        />
        <UserActivityMiniStat
          label="Friends"
          value={props.data.counts.friends}
          icon={<UserCheck className="w-3.5 h-3.5 text-purple-500" />}
        />
        <UserActivityMiniStat
          label="Blocking"
          value={props.data.counts.blocking}
          icon={<Ban className="w-3.5 h-3.5 text-red-500" />}
        />
        <UserActivityMiniStat
          label="Blocked By"
          value={props.data.counts.blockedBy}
          icon={<ShieldBan className="w-3.5 h-3.5 text-orange-500" />}
        />
      </div>

      {/* Pending Friend Requests */}
      {(props.data.counts.pendingFriendRequestsSent > 0 ||
        props.data.counts.pendingFriendRequestsReceived > 0) && (
        <div className="flex gap-3 text-xs">
          {props.data.counts.pendingFriendRequestsSent > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {props.data.counts.pendingFriendRequestsSent} pending sent
            </span>
          )}
          {props.data.counts.pendingFriendRequestsReceived > 0 && (
            <span className="text-blue-600 dark:text-blue-400">
              {props.data.counts.pendingFriendRequestsReceived} pending received
            </span>
          )}
        </div>
      )}

      {/* Rate Indicators */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Activity Rate
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {RATE_INDICATORS.map((indicator) => {
            const value = props.data.rateIndicators[indicator.key]
            return (
              <div key={indicator.key} className={cn('p-2 rounded-md border', getRateBg(value))}>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">
                  {indicator.label}
                </span>
                <span className={cn('text-sm font-bold', getRateColor(value))}>{value}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section Tabs */}
      <UnderlineTabBar
        tabs={sections}
        activeTab={activeSection}
        onTabChange={(id) => handleSectionChange(id as ListSection)}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(ev) => handleSearchChange(ev.target.value)}
          className="pl-9 h-8 text-xs"
        />
      </div>

      {/* List Content */}
      <div className={cn('min-h-[100px]', listQuery.isFetching && 'opacity-60 transition-opacity')}>
        {listQuery.isPending ? (
          <div className="flex items-center justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : listQuery.data && listQuery.data.items.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {debouncedSearch
                ? `No results for "${debouncedSearch}"`
                : EMPTY_MESSAGES[activeSection]}
            </p>
          </div>
        ) : listQuery.data ? (
          <div className="space-y-1">
            {listQuery.data.items.map((item) => (
              <SocialUserRow key={item.id} user={item.user} date={item.date} />
            ))}
          </div>
        ) : null}

        {listQuery.data && listQuery.data.pagination.pages > 1 && (
          <div className="mt-3">
            <Pagination
              page={page}
              totalPages={listQuery.data.pagination.pages}
              totalItems={listQuery.data.pagination.total}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default UserActivitySocialTab
