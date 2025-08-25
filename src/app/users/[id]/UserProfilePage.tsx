'use client'

import {
  Calendar,
  GamepadIcon,
  Grid3X3,
  List,
  Medal,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { isArray, isString } from 'remeda'
import { z } from 'zod'
import { SystemIcon } from '@/components/icons'
import {
  Badge,
  Button,
  Input,
  PageSkeletonLoading,
  PerformanceBadge,
  Pagination,
  LocalizedDate,
} from '@/components/ui'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { api } from '@/lib/api'
import { TRUST_LEVELS } from '@/lib/trust/config'
import { cn } from '@/lib/utils'
import { validateClientData } from '@/utils/client-validation'
import { roleIncludesRole } from '@/utils/permission-system'
import { Role } from '@orm'
import UserDetailsPageError from './components/UserDetailsPageError'

function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const userId = isString(params.id) ? params.id : isArray(params.id) ? params.id[0] : ''

  // Get current tab from URL params
  const activeTab = (searchParams.get('tab') as 'listings' | 'votes') || 'listings'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Pagination and filter state
  const listingsPage = validateClientData(
    parseInt(searchParams.get('listingsPage') || '1'),
    z.number().int().positive(),
    1,
  )
  const votesPage = validateClientData(
    parseInt(searchParams.get('votesPage') || '1'),
    z.number().int().positive(),
    1,
  )
  const [searchFilter, setSearchFilter] = useState(searchParams.get('search') || '')
  const [systemFilter, setSystemFilter] = useState(searchParams.get('system') || '')
  const [emulatorFilter, setEmulatorFilter] = useState(searchParams.get('emulator') || '')

  // Use proper debouncing - not useMemo with setTimeout
  const debouncedSearch = useDebouncedValue(searchFilter, 300)

  const userQuery = api.users.getUserById.useQuery({
    userId,
    listingsPage,
    listingsLimit: 12,
    listingsSearch: debouncedSearch || undefined,
    listingsSystem: systemFilter || undefined,
    listingsEmulator: emulatorFilter || undefined,
    votesPage,
    votesLimit: 12,
    votesSearch: debouncedSearch || undefined,
  })

  const currentUserQuery = api.users.me.useQuery()
  const canViewBannedUsers = roleIncludesRole(currentUserQuery.data?.role, Role.MODERATOR)

  // Update URL params when filters change
  const updateUrlParams = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 1) {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, String(value))
        }
      })

      router.replace(`/users/${userId}?${newSearchParams.toString()}`)
    },
    [router, userId, searchParams],
  )

  const handleTabChange = (tab: 'listings' | 'votes') => {
    updateUrlParams({ tab, listingsPage: 1, votesPage: 1 })
  }

  const handleSearchChange = (value: string) => {
    setSearchFilter(value)
    updateUrlParams({ search: value, listingsPage: 1, votesPage: 1 })
  }

  const handleSystemChange = (value: string) => {
    setSystemFilter(value)
    updateUrlParams({ system: value, listingsPage: 1 })
  }

  const handleEmulatorChange = (value: string) => {
    setEmulatorFilter(value)
    updateUrlParams({ emulator: value, listingsPage: 1 })
  }

  if (userQuery.isPending) return <PageSkeletonLoading />

  if (userQuery.error || !userQuery.data) {
    return <UserDetailsPageError errorMessage={userQuery.error?.message} />
  }

  const user = userQuery.data
  const userTrustLevel =
    TRUST_LEVELS.find((level) => (user.trustScore ?? 0) >= level.minScore) || TRUST_LEVELS[0]

  const currentListings = user.listings.items
  const currentVotes = user.votes.items
  const upvoteCount = currentVotes.filter((vote) => vote.value).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Profile Image & Basic Info */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000" />
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
                    <Image
                      src={user.profileImage ?? '/placeholder/profile.svg'}
                      alt={`${user.name}'s profile picture`}
                      fill
                      sizes="128px"
                      className="object-cover transform transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                </div>

                <div className="mt-4 text-center lg:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {user.name || 'Anonymous User'}
                  </h1>
                  <div className="flex items-center gap-2 justify-center lg:justify-start mb-3">
                    <Badge variant="default" className="text-sm">
                      {user.role}
                    </Badge>
                    {canViewBannedUsers &&
                      'userBans' in user &&
                      Array.isArray(user.userBans) &&
                      user.userBans.length > 0 && (
                        <Badge variant="danger" className="text-sm font-bold">
                          BANNED USER
                        </Badge>
                      )}
                    <Badge
                      variant={userTrustLevel.name === 'New' ? 'default' : 'success'}
                      className="text-sm flex items-center gap-1"
                    >
                      <Medal className="w-3 h-3" />
                      {userTrustLevel.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 justify-center lg:justify-start mb-3">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Joined <LocalizedDate date={user.createdAt ?? new Date()} format="date" />
                    </span>
                  </div>
                  {/* User Badges */}
                  {user.userBadges && user.userBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start mt-3">
                      {user.userBadges.map((userBadge) => (
                        <div
                          key={userBadge.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-700 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200"
                          title={userBadge.badge.description || userBadge.badge.name}
                        >
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                            style={{
                              backgroundColor: userBadge.color || userBadge.badge.color,
                              fontSize: '10px',
                            }}
                          >
                            {userBadge.badge.icon?.charAt(0) ||
                              userBadge.badge.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {userBadge.badge.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <GamepadIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {user._count?.listings ?? 0}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Listings</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <ThumbsUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {upvoteCount}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">Upvotes</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-600 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {user.trustScore}
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">Trust Score</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {user._count?.votes ?? 0}
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">Total Votes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            {/* Tabs and Controls */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === 'listings' ? 'default' : 'outline'}
                    onClick={() => handleTabChange('listings')}
                    className="transition-all duration-200"
                  >
                    Listings ({user._count?.listings ?? 0})
                  </Button>
                  <Button
                    variant={activeTab === 'votes' ? 'default' : 'outline'}
                    onClick={() => handleTabChange('votes')}
                    className="transition-all duration-200"
                  >
                    Votes ({user._count?.votes ?? 0})
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    placeholder="Search..."
                    value={searchFilter}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-48"
                  />

                  {activeTab === 'listings' && (
                    <>
                      <select
                        value={systemFilter}
                        onChange={(e) => handleSystemChange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">All Systems</option>
                        {user.filterOptions.systems.map((system) => (
                          <option key={system} value={system}>
                            {system}
                          </option>
                        ))}
                      </select>

                      <select
                        value={emulatorFilter}
                        onChange={(e) => handleEmulatorChange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">All Emulators</option>
                        {user.filterOptions.emulators.map((emulator) => (
                          <option key={emulator} value={emulator}>
                            {emulator}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  <div className="flex gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="px-2"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="px-2"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'listings' ? (
                <>
                  {currentListings.length > 0 ? (
                    <div
                      className={cn(
                        'gap-6',
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                          : 'flex flex-col space-y-4',
                      )}
                    >
                      {currentListings.map((listing, index) => (
                        <Link
                          key={listing.id}
                          href={`/listings/${listing.id}`}
                          className={cn(
                            'group bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1',
                            'animate-fade-in-up',
                          )}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10">
                              {listing.game?.system?.key ? (
                                <SystemIcon
                                  systemKey={listing.game.system.key}
                                  name={listing.game.system.name}
                                  size="md"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                                  <GamepadIcon className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                                {listing.game?.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {listing.device?.brand.name} {listing.device?.modelName}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="default" size="sm">
                                  {listing.emulator?.name}
                                </Badge>
                                {listing.performance && (
                                  <PerformanceBadge
                                    rank={listing.performance.rank}
                                    label={listing.performance.label}
                                  />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                <LocalizedDate date={listing.createdAt} format="timeAgo" />
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <GamepadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No listings found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchFilter || systemFilter || emulatorFilter
                          ? 'Try adjusting your filters'
                          : "This user hasn't submitted any listings yet"}
                      </p>
                    </div>
                  )}

                  {/* Listings Pagination */}
                  {user.listings.pagination.pages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination
                        currentPage={user.listings.pagination.page}
                        totalPages={user.listings.pagination.pages}
                        totalItems={user.listings.pagination.total}
                        itemsPerPage={user.listings.pagination.limit}
                        onPageChange={(page) => updateUrlParams({ listingsPage: page })}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {currentVotes.length > 0 ? (
                    <div
                      className={cn(
                        'gap-4',
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                          : 'flex flex-col space-y-3',
                      )}
                    >
                      {currentVotes.map((vote, index) => (
                        <Link
                          key={vote.id}
                          href={`/listings/${vote.listing.id}`}
                          className={cn(
                            'group bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1',
                            'animate-fade-in-up',
                          )}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex-shrink-0 p-2 rounded-lg',
                                vote.value
                                  ? 'bg-green-100 dark:bg-green-900/30'
                                  : 'bg-red-100 dark:bg-red-900/30',
                              )}
                            >
                              {vote.value ? (
                                <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                                {vote.listing.game?.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {vote.listing.device?.brand.name} {vote.listing.device?.modelName}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ThumbsUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No votes found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchFilter
                          ? 'Try adjusting your search'
                          : "This user hasn't voted on any listings yet"}
                      </p>
                    </div>
                  )}

                  {/* Votes Pagination */}
                  {user.votes.pagination.pages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination
                        currentPage={user.votes.pagination.page}
                        totalPages={user.votes.pagination.pages}
                        totalItems={user.votes.pagination.total}
                        itemsPerPage={user.votes.pagination.limit}
                        onPageChange={(page) => updateUrlParams({ votesPage: page })}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDetailsPage
