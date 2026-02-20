'use client'

import { useUser } from '@clerk/nextjs'
import { GamepadIcon, Monitor, Rss, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback } from 'react'
import { SystemIcon } from '@/components/icons'
import { Badge, LoadingSpinner, LocalizedDate, Pagination, PerformanceBadge } from '@/components/ui'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import FollowingEmptyState from './components/FollowingEmptyState'
import type { RouterOutput } from '@/types/trpc'

type FeedScope = 'following' | 'community'
type FeedType = 'all' | 'listing' | 'pcListing'

const FEED_SCOPE_VALUES: FeedScope[] = ['following', 'community']
const FEED_TYPE_VALUES: FeedType[] = ['all', 'listing', 'pcListing']

function FeedPageContent() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const rawScope = searchParams.get('scope')
  const scope: FeedScope = FEED_SCOPE_VALUES.includes(rawScope as FeedScope)
    ? (rawScope as FeedScope)
    : 'following'
  const rawType = searchParams.get('type')
  const type: FeedType = FEED_TYPE_VALUES.includes(rawType as FeedType)
    ? (rawType as FeedType)
    : 'all'
  const rawPage = Number(searchParams.get('page'))
  const page = rawPage >= 1 ? rawPage : 1

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        const isDefault =
          (key === 'scope' && value === 'following') ||
          (key === 'type' && value === 'all') ||
          (key === 'page' && value === '1')
        if (isDefault) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const feedQuery = api.social.getActivityFeed.useQuery(
    { page, limit: 20, scope, type },
    { enabled: !!user },
  )

  const handleScopeChange = (newScope: FeedScope) => {
    updateParams({ scope: newScope, type: 'all', page: '1' })
  }

  const handleTypeChange = (newType: FeedType) => {
    updateParams({ type: newType, page: '1' })
  }

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) })
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <Rss className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Activity Feed</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to see activity from users you follow.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Feed</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {scope === 'following'
              ? 'Recent reports from users you follow'
              : 'Recent reports from the community'}
          </p>
        </div>

        {/* Scope Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-11 items-center gap-1 rounded-xl border border-gray-200 bg-gray-100/70 p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
            <button
              type="button"
              onClick={() => handleScopeChange('following')}
              className={cn(
                'h-9 px-4 rounded-lg text-sm font-semibold transition',
                scope === 'following'
                  ? 'bg-white text-gray-900 shadow-md dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-800/70',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Following
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('community')}
              className={cn(
                'h-9 px-4 rounded-lg text-sm font-semibold transition',
                scope === 'community'
                  ? 'bg-white text-gray-900 shadow-md dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-800/70',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Rss className="w-4 h-4" />
                Community
              </span>
            </button>
          </div>
        </div>

        {/* Type Filter Chips */}
        <div className="flex items-center gap-2 mb-6">
          <TypeChip active={type === 'all'} onClick={() => handleTypeChange('all')} label="All" />
          <TypeChip
            active={type === 'listing'}
            onClick={() => handleTypeChange('listing')}
            label="Handheld"
            icon={<GamepadIcon className="w-3.5 h-3.5" />}
          />
          <TypeChip
            active={type === 'pcListing'}
            onClick={() => handleTypeChange('pcListing')}
            label="PC"
            icon={<Monitor className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Feed Content */}
        {feedQuery.isPending ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : feedQuery.data?.items.length === 0 ? (
          scope === 'following' ? (
            <FollowingEmptyState />
          ) : (
            <div className="text-center py-20">
              <Rss className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No reports yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                No community reports match your filters.
              </p>
            </div>
          )
        ) : (
          <>
            <div className="space-y-4">
              {feedQuery.data?.items.map((item) => (
                <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
              ))}
            </div>

            {feedQuery.data && feedQuery.data.pagination.pages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  page={feedQuery.data.pagination.page}
                  totalPages={feedQuery.data.pagination.pages}
                  totalItems={feedQuery.data.pagination.total}
                  itemsPerPage={feedQuery.data.pagination.limit}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TypeChip(props: {
  active: boolean
  onClick: () => void
  label: string
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
        props.active
          ? 'bg-white text-gray-900 shadow-md dark:bg-gray-800 dark:text-gray-100'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300',
      )}
    >
      {props.icon}
      {props.label}
    </button>
  )
}

type FeedItem = RouterOutput['social']['getActivityFeed']['items'][number]

function FeedCard(props: { item: FeedItem }) {
  const isPC = props.item.type === 'pcListing'
  const href = isPC ? `/pc-listings/${props.item.data.id}` : `/listings/${props.item.data.id}`

  return (
    <div
      className={cn(
        'group relative block rounded-2xl border p-5 transition-all duration-300',
        'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg',
        'dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600',
      )}
    >
      <Link
        href={href}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={props.item.data.game?.title ?? 'View report'}
      />
      <div className="relative z-[1] pointer-events-none flex items-start gap-4">
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 shadow-sm dark:bg-gray-700">
          {props.item.data.game?.system?.key ? (
            <SystemIcon
              systemKey={props.item.data.game.system.key}
              name={props.item.data.game.system.name}
              size="md"
            />
          ) : (
            <div
              className={cn(
                'flex h-full w-full items-center justify-center rounded-xl text-white',
                isPC
                  ? 'bg-gradient-to-br from-purple-500 to-blue-600'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600',
              )}
            >
              {isPC ? <Monitor className="h-5 w-5" /> : <GamepadIcon className="h-5 w-5" />}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                {props.item.data.game?.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {props.item.type === 'listing' ? (
                  <>
                    {props.item.data.device.brand?.name} {props.item.data.device.modelName}
                  </>
                ) : (
                  <>
                    {props.item.data.cpu.brand?.name} {props.item.data.cpu.modelName}
                    {props.item.data.gpu
                      ? ` · ${props.item.data.gpu.brand?.name} ${props.item.data.gpu.modelName}`
                      : ''}
                  </>
                )}
              </p>
            </div>
            {props.item.data.performance ? (
              <PerformanceBadge
                rank={props.item.data.performance.rank}
                label={props.item.data.performance.label}
                description={props.item.data.performance.description}
                pill
                className="hidden shrink-0 sm:block"
              />
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={isPC ? 'info' : 'primary'} size="sm" pill>
              {isPC ? 'PC' : 'Handheld'}
            </Badge>
            {props.item.data.emulator?.name ? (
              <Badge variant="default" size="sm" pill>
                {props.item.data.emulator.name}
              </Badge>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              {props.item.data.author.profileImage && (
                <Image
                  src={props.item.data.author.profileImage}
                  alt=""
                  width={16}
                  height={16}
                  className="rounded-full object-cover"
                  unoptimized
                />
              )}
              by{' '}
              <Link
                href={`/users/${props.item.data.author.id}`}
                className="pointer-events-auto font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {props.item.data.author.name || 'Anonymous'}
              </Link>
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              <LocalizedDate date={props.item.data.createdAt} format="timeAgo" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <FeedPageContent />
    </Suspense>
  )
}
