'use client'

import { motion } from 'framer-motion'
import { Bookmark, GamepadIcon, Monitor } from 'lucide-react'
import Link from 'next/link'
import { SystemIcon } from '@/components/icons'
import { Badge, LocalizedDate, PerformanceBadge, SuccessRateBar } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { RouterOutput } from '@/types/trpc'

type VisibleListingResult = Extract<
  RouterOutput['bookmarks']['getListingBookmarks'],
  { visibility: 'visible' }
>
type VisiblePcResult = Extract<
  RouterOutput['bookmarks']['getPcListingBookmarks'],
  { visibility: 'visible' }
>

type ListingBookmarkItem = VisibleListingResult['items'][number]
type PcListingBookmarkItem = VisiblePcResult['items'][number]

interface HandheldProps {
  item: ListingBookmarkItem
  variant: 'handheld'
  index: number
}

interface PcProps {
  item: PcListingBookmarkItem
  variant: 'pc'
  index: number
}

type Props = HandheldProps | PcProps

function BookmarkCard(props: Props) {
  const isPC = props.variant === 'pc'
  const listing = isPC ? props.item.pcListing : props.item.listing
  const href = isPC ? `/pc-listings/${listing.id}` : `/listings/${listing.id}`
  const accentColor = isPC ? 'purple' : 'blue'

  const subtitle = isPC
    ? formatPcSubtitle(props.item.pcListing)
    : formatHandheldSubtitle(props.item.listing)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: props.index * 0.04 }}
    >
      <Link
        href={href}
        className={cn(
          'group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 transition-all duration-300',
          'border-gray-200/70 bg-white hover:-translate-y-1 hover:shadow-xl',
          'dark:border-white/[0.06] dark:bg-gray-800/60',
          accentColor === 'blue' && 'hover:border-blue-300 dark:hover:border-blue-500/30',
          accentColor === 'purple' && 'hover:border-purple-300 dark:hover:border-purple-500/30',
        )}
      >
        <div className="flex items-start gap-4">
          <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 ring-1 ring-gray-200/80 dark:bg-gray-900/80 dark:ring-white/10">
            {listing.game?.system?.key ? (
              <SystemIcon
                systemKey={listing.game.system.key}
                name={listing.game.system.name}
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

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3
                  className={cn(
                    'truncate font-semibold text-gray-900 transition-colors duration-200 dark:text-gray-100',
                    accentColor === 'blue' &&
                      'group-hover:text-blue-600 dark:group-hover:text-blue-400',
                    accentColor === 'purple' &&
                      'group-hover:text-purple-600 dark:group-hover:text-purple-400',
                  )}
                >
                  {listing.game?.title}
                </h3>
                <p className="truncate text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              </div>
              {listing.performance ? (
                <PerformanceBadge
                  rank={listing.performance.rank}
                  label={listing.performance.label}
                  description={listing.performance.description}
                  pill
                  className="hidden shrink-0 text-sm sm:block"
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {listing.emulator?.name ? (
            <Badge
              variant="primary"
              size="sm"
              pill
              className={cn(
                'shadow-sm',
                isPC
                  ? 'dark:bg-purple-900/40 dark:text-purple-200'
                  : 'dark:bg-blue-900/40 dark:text-blue-200',
              )}
            >
              {listing.emulator.name}
            </Badge>
          ) : null}
          {listing.game?.system?.name && (
            <Badge variant="default" size="sm" pill className="shadow-sm">
              {listing.game.system.name}
            </Badge>
          )}
          {listing.performance ? (
            <PerformanceBadge
              rank={listing.performance.rank}
              label={listing.performance.label}
              description={listing.performance.description}
              pill
              className="sm:hidden"
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Bookmark className="size-3 text-amber-400" />
            <LocalizedDate date={props.item.createdAt} format="timeAgo" />
          </div>
          {listing._count.votes > 0 && (
            <SuccessRateBar
              rate={listing.successRate * 100}
              voteCount={listing._count.votes}
              compact
            />
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function formatHandheldSubtitle(listing: ListingBookmarkItem['listing']): string {
  return (
    [listing.device?.brand.name, listing.device?.modelName].filter(Boolean).join(' ').trim() ||
    'Unknown device'
  )
}

function formatPcSubtitle(pcListing: PcListingBookmarkItem['pcListing']): string {
  const cpu = [pcListing.cpu?.brand?.name, pcListing.cpu?.modelName]
    .filter(Boolean)
    .join(' ')
    .trim()
  const gpu = pcListing.gpu
    ? [pcListing.gpu.brand?.name, pcListing.gpu.modelName].filter(Boolean).join(' ').trim()
    : null
  return [cpu, gpu].filter(Boolean).join(' · ') || 'Unknown hardware'
}

export default BookmarkCard
