'use client'

import Link from 'next/link'
import { PerformanceBadge, LocalizedDate } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'

type ListingVisibleResult = Extract<
  RouterOutput['bookmarks']['getListingBookmarks'],
  { visibility: 'visible' }
>

type PcVisibleResult = Extract<
  RouterOutput['bookmarks']['getPcListingBookmarks'],
  { visibility: 'visible' }
>

type ListingBookmarkItem = ListingVisibleResult['items'][number]
type PcBookmarkItem = PcVisibleResult['items'][number]

type Props =
  | { variant: 'handheld'; item: ListingBookmarkItem }
  | { variant: 'pc'; item: PcBookmarkItem }

function getRowData(props: Props) {
  if (props.variant === 'handheld') {
    const listing = props.item.listing
    return {
      href: `/listings/${listing.id}`,
      title: listing.game.title,
      subtitle: `${listing.device.brand.name} ${listing.device.modelName}${listing.emulator ? ` · ${listing.emulator.name}` : ''}`,
      performance: listing.performance,
      createdAt: props.item.createdAt,
    }
  }

  const pcListing = props.item.pcListing
  return {
    href: `/pc-listings/${pcListing.id}`,
    title: pcListing.game.title,
    subtitle: `${pcListing.cpu.brand.name} ${pcListing.cpu.modelName}${pcListing.gpu ? ` · ${pcListing.gpu.brand.name} ${pcListing.gpu.modelName}` : ''}${pcListing.emulator ? ` · ${pcListing.emulator.name}` : ''}`,
    performance: pcListing.performance,
    createdAt: props.item.createdAt,
  }
}

function BookmarkRow(props: Props) {
  const data = getRowData(props)

  return (
    <Link
      href={data.href}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{data.title}</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{data.subtitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {data.performance && (
          <PerformanceBadge rank={data.performance.rank} label={data.performance.label} />
        )}
        <LocalizedDate
          date={data.createdAt}
          format="timeAgo"
          className="text-[10px] text-gray-400"
        />
      </div>
    </Link>
  )
}

export default BookmarkRow
