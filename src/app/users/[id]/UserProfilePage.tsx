'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  Calendar,
  GamepadIcon,
  Grid3X3,
  List,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Monitor,
  Award,
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
  PerformanceBadge,
  Pagination,
  LocalizedDate,
  TrustLevelBadge,
} from '@/components/ui'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { getRoleVariant } from '@/utils/badgeColors'
import { validateClientData } from '@/utils/client-validation'
import { formatUserRole } from '@/utils/format'
import { roleIncludesRole } from '@/utils/permission-system'
import { Role } from '@orm'
import UserDetailsPageError from './components/UserDetailsPageError'
import UserProfilePageSkeleton from './components/UserProfilePageSkeleton'
import type { ReactNode } from 'react'

interface ContributionHighlight {
  label: string
  value: number
  icon: ReactNode
  accent: string
}

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

  if (userQuery.isPending) return <UserProfilePageSkeleton />

  if (userQuery.error || !userQuery.data) {
    return <UserDetailsPageError errorMessage={userQuery.error?.message} />
  }

  const contributionSummary = userQuery.data.contributionSummary
  const voteSummary = userQuery.data.voteSummary ?? { total: 0, upvotes: 0, downvotes: 0 }
  const positiveVoteRatio =
    voteSummary.total > 0 ? Math.round((voteSummary.upvotes / voteSummary.total) * 100) : 0

  const contributionStats: ContributionHighlight[] = [
    {
      label: 'Total Contributions',
      value: contributionSummary.total,
      icon: <Award className="h-5 w-5" />,
      accent: 'from-yellow-400 to-amber-500',
    },
    {
      label: 'Handheld Reports',
      value: contributionSummary.listings,
      icon: <GamepadIcon className="h-5 w-5" />,
      accent: 'from-blue-500 to-blue-600',
    },
    {
      label: 'PC Reports',
      value: contributionSummary.pcListings,
      icon: <Monitor className="h-5 w-5" />,
      accent: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Trust Score',
      value: userQuery.data.trustScore ?? 0,
      icon: <TrendingUp className="h-5 w-5" />,
      accent: 'from-emerald-500 to-emerald-600',
    },
  ] satisfies { label: string; value: number; icon: ReactNode; accent: string }[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-2xl">
            <div className="flex flex-col gap-8 lg:flex-row lg:flex-wrap lg:items-start xl:flex-nowrap">
              {/* Profile Image & Basic Info */}
              <div className="flex w-full flex-col items-center lg:max-w-2xl lg:items-start xl:max-w-none">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000" />
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
                    <Image
                      src={userQuery.data.profileImage ?? '/placeholder/profile.svg'}
                      alt={`${userQuery.data.name}'s profile picture`}
                      fill
                      sizes="128px"
                      className="object-cover transform transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                </div>

                <div className="mt-4 text-center lg:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {userQuery.data.name || 'Anonymous User'}
                  </h1>
                  <div className="flex items-center gap-2 justify-center lg:justify-start mb-3">
                    <Badge variant={getRoleVariant(userQuery.data.role)} className="text-sm">
                      {formatUserRole(userQuery.data.role)}
                    </Badge>
                    {canViewBannedUsers &&
                      'userBans' in userQuery.data &&
                      Array.isArray(userQuery.data.userBans) &&
                      userQuery.data.userBans.length > 0 && (
                        <Badge variant="danger" className="text-sm font-bold">
                          BANNED USER
                        </Badge>
                      )}
                    <TrustLevelBadge trustScore={userQuery.data.trustScore} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 justify-center lg:justify-start mb-3">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Joined{' '}
                      <LocalizedDate date={userQuery.data.createdAt ?? new Date()} format="date" />
                    </span>
                  </div>
                  {/* User Badges */}
                  {userQuery.data.userBadges && userQuery.data.userBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start mt-3">
                      {userQuery.data.userBadges.map((userBadge) => (
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
                  {userQuery.data.bio ? (
                    <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {userQuery.data.bio}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Contribution Overview */}
              <div className="flex-1 w-full min-w-0 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {contributionStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-900/70"
                    >
                      <div
                        className={`mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} p-2 text-white shadow-md`}
                      >
                        {stat.icon}
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.value.toLocaleString()}
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                        {stat.label}
                      </p>
                      {stat.label === 'Total Contributions' &&
                        contributionSummary.lastContributionAt && (
                          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            Last contribution{' '}
                            {formatDistanceToNow(contributionSummary.lastContributionAt, {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 shadow-sm dark:border-indigo-700 dark:bg-indigo-900/40">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-md">
                        <ThumbsUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                          {voteSummary.total.toLocaleString()}
                        </p>
                        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-200">
                          Votes Cast
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-pink-200 bg-pink-50/80 p-5 shadow-sm dark:border-pink-700 dark:bg-pink-900/40">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-pink-600 p-2 text-white shadow-md">
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                          {positiveVoteRatio}%
                        </p>
                        <p className="text-sm font-medium text-pink-700 dark:text-pink-200">
                          Upvote Ratio
                        </p>
                      </div>
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
                    Reports ({userQuery.data._count?.listings ?? 0})
                  </Button>
                  <Button
                    variant={activeTab === 'votes' ? 'default' : 'outline'}
                    onClick={() => handleTabChange('votes')}
                    className="transition-all duration-200"
                  >
                    Votes ({voteSummary.total})
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
                        {userQuery.data.filterOptions.systems.map((system) => (
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
                        {userQuery.data.filterOptions.emulators.map((emulator) => (
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
                  {userQuery.data.listings.items.length > 0 ? (
                    <div
                      className={cn(
                        'gap-6',
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                          : 'flex flex-col space-y-4',
                      )}
                    >
                      {userQuery.data.listings.items.map((listing, index) => (
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
                        No Compatibility Reports found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchFilter || systemFilter || emulatorFilter
                          ? 'Try adjusting your filters'
                          : "This user hasn't submitted any Compatibility Reports yet"}
                      </p>
                    </div>
                  )}

                  {/* Listings Pagination */}
                  {userQuery.data.listings.pagination.pages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination
                        page={userQuery.data.listings.pagination.page}
                        totalPages={userQuery.data.listings.pagination.pages}
                        totalItems={userQuery.data.listings.pagination.total}
                        itemsPerPage={userQuery.data.listings.pagination.limit}
                        onPageChange={(page) => updateUrlParams({ listingsPage: page })}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {userQuery.data.votes.items.length > 0 ? (
                    <div
                      className={cn(
                        'gap-4',
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                          : 'flex flex-col space-y-3',
                      )}
                    >
                      {userQuery.data.votes.items.map((vote, index) => (
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
                          : "This user hasn't voted on any Compatibility Reports yet"}
                      </p>
                    </div>
                  )}

                  {/* Votes Pagination */}
                  {userQuery.data.votes.pagination.pages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination
                        page={userQuery.data.votes.pagination.page}
                        totalPages={userQuery.data.votes.pagination.pages}
                        totalItems={userQuery.data.votes.pagination.total}
                        itemsPerPage={userQuery.data.votes.pagination.limit}
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
