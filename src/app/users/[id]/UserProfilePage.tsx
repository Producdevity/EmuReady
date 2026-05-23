'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  Award,
  Calendar,
  Gamepad2,
  GamepadIcon,
  Grid3X3,
  List,
  Monitor,
  Settings,
  Shield,
  Star,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { isArray, isString } from 'remeda'
import { z } from 'zod'
import {
  Badge,
  BannedUserBadge,
  Button,
  Input,
  Pagination,
  LocalizedDate,
  SegmentedTabs,
  TrustLevelBadge,
  UserBadgeItem,
} from '@/components/ui'
import { Dropdown } from '@/components/ui/Dropdown'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import { getRoleVariant } from '@/utils/badge-colors'
import { validateClientData } from '@/utils/client-validation'
import { formatUserRole } from '@/utils/format'
import getErrorMessage from '@/utils/getErrorMessage'
import { roleIncludesRole } from '@/utils/permission-system'
import { Role } from '@orm'
import FollowListModal from './components/FollowListModal'
import GameFollowListModal from './components/GameFollowListModal'
import ProfileListingCard from './components/ProfileListingCard'
import ProfileVoteCard from './components/ProfileVoteCard'
import UserBookmarksSection from './components/UserBookmarksSection'
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
  const searchParams = useSearchParams()

  const userId = isString(params.id) ? params.id : isArray(params.id) ? params.id[0] : ''

  type ProfileTab = 'listings' | 'pcListings' | 'votes' | 'bookmarks'
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    (searchParams.get('tab') as ProfileTab) || 'listings',
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [listingsPage, setListingsPage] = useState(
    validateClientData(
      parseInt(searchParams.get('listingsPage') || '1'),
      z.number().int().positive(),
      1,
    ),
  )
  const [pcListingsPage, setPcListingsPage] = useState(
    validateClientData(
      parseInt(searchParams.get('pcListingsPage') || '1'),
      z.number().int().positive(),
      1,
    ),
  )
  const [votesPage, setVotesPage] = useState(
    validateClientData(
      parseInt(searchParams.get('votesPage') || '1'),
      z.number().int().positive(),
      1,
    ),
  )
  const [searchFilter, setSearchFilter] = useState(searchParams.get('search') || '')
  const [deviceFilter, setDeviceFilter] = useState(searchParams.get('device') || '')
  const [emulatorFilter, setEmulatorFilter] = useState(searchParams.get('emulator') || '')
  const [followListModal, setFollowListModal] = useState<{
    open: boolean
    type: 'followers' | 'following'
  }>({ open: false, type: 'followers' })
  const [gameFollowModalOpen, setGameFollowModalOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(searchFilter, 300)

  // Keep URL in sync with state for shareability
  useEffect(() => {
    const params = new URLSearchParams()
    if (activeTab !== 'listings') params.set('tab', activeTab)
    if (listingsPage > 1) params.set('listingsPage', String(listingsPage))
    if (pcListingsPage > 1) params.set('pcListingsPage', String(pcListingsPage))
    if (votesPage > 1) params.set('votesPage', String(votesPage))
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (deviceFilter) params.set('device', deviceFilter)
    if (emulatorFilter) params.set('emulator', emulatorFilter)
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [
    activeTab,
    listingsPage,
    pcListingsPage,
    votesPage,
    debouncedSearch,
    deviceFilter,
    emulatorFilter,
  ])

  const userQuery = api.users.getUserById.useQuery({
    userId,
    listingsPage,
    listingsLimit: 12,
    listingsSearch: debouncedSearch || undefined,
    listingsDevice: deviceFilter || undefined,
    listingsEmulator: emulatorFilter || undefined,
    pcListingsPage,
    pcListingsLimit: 12,
    pcListingsSearch: activeTab === 'pcListings' ? debouncedSearch || undefined : undefined,
    votesPage,
    votesLimit: 12,
    votesSearch: debouncedSearch || undefined,
  })

  const utils = api.useUtils()
  const currentUserQuery = api.users.me.useQuery()
  const canViewBannedUsers = roleIncludesRole(currentUserQuery.data?.role, Role.MODERATOR)
  const isOwnProfile = currentUserQuery.data?.id === userId
  const isAuthenticated = Boolean(currentUserQuery.data?.id)

  const followQuery = api.social.isFollowing.useQuery(
    { userId },
    { enabled: isAuthenticated && !isOwnProfile },
  )
  const followCountsQuery = api.social.getFollowCounts.useQuery({ userId })
  const gameFollowCountQuery = api.gameFollows.getGameFollowCount.useQuery(
    { userId },
    { enabled: !!userQuery.data },
  )
  const bookmarkCountsQuery = api.bookmarks.getCounts.useQuery(
    { userId },
    { enabled: !!userQuery.data },
  )

  const followMutation = api.social.follow.useMutation({
    onSuccess: () => {
      utils.social.isFollowing.invalidate({ userId }).catch(console.error)
      utils.social.getFollowCounts.invalidate({ userId }).catch(console.error)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
  const unfollowMutation = api.social.unfollow.useMutation({
    onSuccess: () => {
      utils.social.isFollowing.invalidate({ userId }).catch(console.error)
      utils.social.getFollowCounts.invalidate({ userId }).catch(console.error)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab)
    setListingsPage(1)
    setPcListingsPage(1)
    setVotesPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchFilter(value)
    setListingsPage(1)
    setVotesPage(1)
  }

  const handleDeviceChange = (value: string) => {
    setDeviceFilter(value)
    setListingsPage(1)
  }

  const handleEmulatorChange = (value: string) => {
    setEmulatorFilter(value)
    setListingsPage(1)
  }

  const deviceOptions = useMemo(() => {
    const devices = userQuery.data?.filterOptions.devices ?? []
    return [
      { value: '', label: 'All Devices' } as const,
      ...devices.map((device) => ({ value: device.id, label: device.label })),
    ]
  }, [userQuery.data?.filterOptions.devices])

  const emulatorOptions = useMemo(() => {
    const emulators = userQuery.data?.filterOptions.emulators ?? []
    return [
      { value: '', label: 'All Emulators' } as const,
      ...emulators
        .filter((emulator): emulator is string => Boolean(emulator))
        .map((emulator) => ({ value: emulator, label: emulator })),
    ]
  }, [userQuery.data?.filterOptions.emulators])

  const showVotesTab =
    isOwnProfile ||
    canViewBannedUsers ||
    !userQuery.data ||
    !('showVotingActivity' in userQuery.data) ||
    userQuery.data.showVotingActivity !== false

  const bookmarkCounts =
    bookmarkCountsQuery.data?.visibility === 'visible' ? bookmarkCountsQuery.data.counts : null
  const totalBookmarks = bookmarkCounts
    ? bookmarkCounts.listingBookmarks + bookmarkCounts.pcListingBookmarks
    : 0
  const showBookmarksTab = bookmarkCounts !== null && totalBookmarks > 0

  const activityTabs = useMemo(() => {
    const tabs = [
      { id: 'listings', label: 'Handheld', count: userQuery.data?._count?.listings ?? 0 },
      { id: 'pcListings', label: 'PC', count: userQuery.data?._count?.pcListings ?? 0 },
    ]
    if (showVotesTab) {
      tabs.push({ id: 'votes', label: 'Votes', count: userQuery.data?.voteSummary?.total ?? 0 })
    }
    if (showBookmarksTab) {
      tabs.push({ id: 'bookmarks', label: 'Bookmarks', count: totalBookmarks })
    }
    return tabs
  }, [
    userQuery.data?._count?.listings,
    userQuery.data?._count?.pcListings,
    showVotesTab,
    userQuery.data?.voteSummary?.total,
    showBookmarksTab,
    totalBookmarks,
  ])

  if (userQuery.isPending) return <UserProfilePageSkeleton />

  if (userQuery.error || !userQuery.data) {
    return <UserDetailsPageError errorMessage={userQuery.error?.message} />
  }

  const contributionSummary = userQuery.data.contributionSummary
  const voteSummary = userQuery.data.voteSummary
  const positiveVoteRatio =
    voteSummary && voteSummary.total > 0
      ? Math.round((voteSummary.upvotes / voteSummary.total) * 100)
      : 0

  const contributionStats: ContributionHighlight[] = [
    {
      label: 'Total Contributions',
      value: contributionSummary?.total ?? 0,
      icon: <Award className="h-5 w-5" />,
      accent: 'from-yellow-400 to-amber-500',
    },
    {
      label: 'Handheld Reports',
      value: contributionSummary?.listings ?? 0,
      icon: <GamepadIcon className="h-5 w-5" />,
      accent: 'from-blue-500 to-blue-600',
    },
    {
      label: 'PC Reports',
      value: contributionSummary?.pcListings ?? 0,
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
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Profile Image & Basic Info */}
              <div className="flex flex-col items-center lg:col-span-1 lg:items-start">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-25 group-hover:opacity-40 transition duration-1000" />
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
                    <BannedUserBadge
                      author={userQuery.data}
                      canView={canViewBannedUsers}
                      size="md"
                      className="text-sm font-bold"
                    />
                    <TrustLevelBadge trustScore={userQuery.data.trustScore} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 justify-center lg:justify-start mb-3">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Joined{' '}
                      <LocalizedDate date={userQuery.data.createdAt ?? new Date()} format="date" />
                    </span>
                  </div>
                  {followCountsQuery.data && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 justify-center lg:justify-start mb-3">
                      <button
                        type="button"
                        onClick={() => setFollowListModal({ open: true, type: 'followers' })}
                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {followCountsQuery.data.followersCount}
                        </span>{' '}
                        {followCountsQuery.data.followersCount === 1 ? 'follower' : 'followers'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFollowListModal({ open: true, type: 'following' })}
                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {followCountsQuery.data.followingCount}
                        </span>{' '}
                        following
                      </button>
                    </div>
                  )}
                  {gameFollowCountQuery.data?.visibility === 'visible' &&
                    gameFollowCountQuery.data.counts.followedGames > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 justify-center lg:justify-start mb-3">
                        <button
                          type="button"
                          onClick={() => setGameFollowModalOpen(true)}
                          className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Gamepad2 className="w-4 h-4" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {gameFollowCountQuery.data.counts.followedGames}
                          </span>{' '}
                          {gameFollowCountQuery.data.counts.followedGames === 1
                            ? 'game followed'
                            : 'games followed'}
                        </button>
                      </div>
                    )}
                  {!isOwnProfile &&
                    isAuthenticated &&
                    (userQuery.data.allowFollows !== false || followQuery.data?.isFollowing) && (
                      <div className="mb-3 flex justify-center lg:justify-start">
                        {followQuery.data?.isFollowing ? (
                          <Button
                            variant="outline"
                            size="sm"
                            rounded
                            onClick={() => unfollowMutation.mutate({ userId })}
                            disabled={unfollowMutation.isPending}
                          >
                            Following
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            rounded
                            onClick={() => followMutation.mutate({ userId })}
                            disabled={followMutation.isPending}
                          >
                            Follow
                          </Button>
                        )}
                      </div>
                    )}
                  {/* User Badges */}
                  {userQuery.data.userBadges && userQuery.data.userBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start mt-3">
                      {userQuery.data.userBadges.map((userBadge) => (
                        <UserBadgeItem
                          key={userBadge.id}
                          name={userBadge.badge.name}
                          color={userBadge.color || userBadge.badge.color}
                          icon={userBadge.badge.icon}
                          description={userBadge.badge.description}
                        />
                      ))}
                    </div>
                  )}
                  {userQuery.data.bio ? (
                    <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {userQuery.data.bio}
                    </p>
                  ) : null}
                  {isOwnProfile && (
                    <div className="mt-4">
                      <Button variant="outline" size="sm" rounded asChild icon={Settings}>
                        <Link href="/profile">Account Settings</Link>
                      </Button>
                    </div>
                  )}
                  {canViewBannedUsers && !isOwnProfile && (
                    <div className="mt-2">
                      <Button variant="outline" size="sm" rounded asChild icon={Shield}>
                        <Link href={`/admin/users?userId=${userId}`}>Manage User</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Contribution Overview */}
              <div className="flex w-full flex-col space-y-4 lg:col-span-2">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                        contributionSummary &&
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
                          {(voteSummary?.total ?? 0).toLocaleString()}
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
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <SegmentedTabs
                  tabs={activityTabs}
                  activeTab={activeTab}
                  onTabChange={(tab) => handleTabChange(tab as ProfileTab)}
                  layoutId="profile-activity-tabs"
                  className="w-full xl:w-auto"
                />

                <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <Input
                    placeholder="Search..."
                    value={searchFilter}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="h-11 w-full sm:w-72"
                    aria-label="Search reports"
                  />

                  {activeTab === 'listings' ? (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Dropdown
                        options={deviceOptions}
                        value={deviceFilter}
                        onChange={handleDeviceChange}
                        className="w-full sm:w-44"
                        triggerClassName="h-11 border border-transparent bg-white/90 text-sm font-medium text-gray-700 hover:bg-white dark:bg-gray-800/80 dark:text-gray-200"
                        placeholder="All Devices"
                      />
                      <Dropdown
                        options={emulatorOptions}
                        value={emulatorFilter}
                        onChange={handleEmulatorChange}
                        className="w-full sm:w-44"
                        triggerClassName="h-11 border border-transparent bg-white/90 text-sm font-medium text-gray-700 hover:bg-white dark:bg-gray-800/80 dark:text-gray-200"
                        placeholder="All Emulators"
                      />
                    </div>
                  ) : null}

                  <div className="flex h-11 items-center gap-1 rounded-xl border border-gray-200 bg-white/80 px-1 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'h-9 w-9 p-0',
                        viewMode === 'grid'
                          ? 'shadow-sm'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100',
                      )}
                      aria-label="Grid view"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'h-9 w-9 p-0',
                        viewMode === 'list'
                          ? 'shadow-sm'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100',
                      )}
                      aria-label="List view"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'listings' && (
                <>
                  {userQuery.data.listings.items.length > 0 ? (
                    <div
                      className={cn(
                        'gap-4',
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                          : 'flex flex-col',
                      )}
                    >
                      {userQuery.data.listings.items.map((listing, index) => (
                        <ProfileListingCard
                          key={listing.id}
                          report={listing}
                          variant="handheld"
                          viewMode={viewMode}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <GamepadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Handheld Reports found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchFilter || deviceFilter || emulatorFilter
                          ? 'Try adjusting your filters'
                          : "This user hasn't submitted any handheld reports yet"}
                      </p>
                    </div>
                  )}

                  {userQuery.data.listings.pagination.pages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination
                        page={userQuery.data.listings.pagination.page}
                        totalPages={userQuery.data.listings.pagination.pages}
                        totalItems={userQuery.data.listings.pagination.total}
                        itemsPerPage={userQuery.data.listings.pagination.limit}
                        onPageChange={setListingsPage}
                      />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'pcListings' && (
                <>
                  {userQuery.data.pcListings.items.length > 0 ? (
                    <div
                      className={cn(
                        'gap-4',
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                          : 'flex flex-col',
                      )}
                    >
                      {userQuery.data.pcListings.items.map((pcListing, index) => (
                        <ProfileListingCard
                          key={pcListing.id}
                          report={pcListing}
                          variant="pc"
                          viewMode={viewMode}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No PC Reports found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchFilter
                          ? 'Try adjusting your search'
                          : "This user hasn't submitted any PC reports yet"}
                      </p>
                    </div>
                  )}

                  {userQuery.data.pcListings.pagination.pages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination
                        page={userQuery.data.pcListings.pagination.page}
                        totalPages={userQuery.data.pcListings.pagination.pages}
                        totalItems={userQuery.data.pcListings.pagination.total}
                        itemsPerPage={userQuery.data.pcListings.pagination.limit}
                        onPageChange={setPcListingsPage}
                      />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'votes' && (
                <>
                  {userQuery.data.votes.items.length > 0 ? (
                    <div
                      className={cn(
                        'gap-4',
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                          : 'flex flex-col',
                      )}
                    >
                      {userQuery.data.votes.items.map((vote, index) => (
                        <ProfileVoteCard
                          key={vote.id}
                          vote={vote}
                          viewMode={viewMode}
                          index={index}
                        />
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
                          : "This user hasn't voted on any compatibility reports yet"}
                      </p>
                    </div>
                  )}

                  {userQuery.data.votes.pagination.pages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination
                        page={userQuery.data.votes.pagination.page}
                        totalPages={userQuery.data.votes.pagination.pages}
                        totalItems={userQuery.data.votes.pagination.total}
                        itemsPerPage={userQuery.data.votes.pagination.limit}
                        onPageChange={setVotesPage}
                      />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'bookmarks' && bookmarkCounts && (
                <UserBookmarksSection
                  userId={userId}
                  handheldCount={bookmarkCounts.listingBookmarks}
                  pcCount={bookmarkCounts.pcListingBookmarks}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <FollowListModal
        userId={userId}
        type={followListModal.type}
        open={followListModal.open}
        onOpenChange={(open) => setFollowListModal((prev) => ({ ...prev, open }))}
      />

      <GameFollowListModal
        userId={userId}
        open={gameFollowModalOpen}
        onOpenChange={setGameFollowModalOpen}
      />
    </div>
  )
}

export default UserDetailsPage
