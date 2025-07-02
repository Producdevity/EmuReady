import {
  ExternalLink,
  Clock,
  Heart,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type MouseEvent } from 'react'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import {
  Button,
  PerformanceBadge,
  SuccessRateBar,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  ProgressiveImage,
} from '@/components/ui'
import SwipeableCard from '@/components/ui/SwipeableCard'
import { cn } from '@/lib/utils'
import { formatTimeAgo } from '@/utils/date'
import getGameImageUrl from '@/utils/images/getGameImageUrl'
import { ApprovalStatus } from '@orm'
import type { RouterOutput } from '@/types/trpc'

type Listing = RouterOutput['listings']['get']['listings'][number]

interface Props {
  listing: Listing
  viewMode: 'grid' | 'list'
  showSystemIcons?: boolean
  onLike?: () => void
  onComment?: () => void
}

export function ListingCard({
  listing,
  viewMode,
  showSystemIcons = false,
  onLike,
  onComment,
}: Props) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = () => {
    setIsLiked(!isLiked)
    if (onLike) onLike()

    // Trigger haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  const handleComment = () => {
    if (onComment) onComment()
    else router.push(`/listings/${listing.id}#comments`)
  }

  const navigateToListing = () => {
    router.push(`/listings/${listing.id}`)
  }

  const navigateToGame = (ev: MouseEvent) => {
    ev.stopPropagation()
    router.push(`/games/${listing.game.id}`)
  }

  // Get game cover image or placeholder
  const gameCoverUrl = getGameImageUrl(listing.game) || '/placeholder/game.svg'

  // Generate accessible labels
  const gameTitle = listing.game.title
  const deviceName = listing.device
    ? `${listing.device.brand.name} ${listing.device.modelName}`
    : 'Unknown Device'
  const emulatorName = listing.emulator?.name || 'Unknown Emulator'
  const performanceLabel = listing.performance?.label || 'N/A'
  const successRate = Math.round(listing.successRate * 100)
  const voteCount = listing._count.votes

  return (
    <SwipeableCard
      onSwipeLeft={handleComment}
      onSwipeRight={handleLike}
      onClick={navigateToListing}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 group cursor-pointer',
        'hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50',
        'hover:border-gray-300 dark:hover:border-gray-600',
        'hover:-translate-y-1',
        viewMode === 'list' ? 'flex items-center p-4 shadow-sm' : 'shadow-lg',
      )}
      aria-label={`${gameTitle} on ${deviceName} using ${emulatorName}. Performance: ${performanceLabel}. Success rate: ${successRate}% with ${voteCount} votes.`}
    >
      {viewMode === 'grid' ? (
        <div className="relative overflow-hidden">
          {/* Game Cover Image - Hero Section */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <ProgressiveImage
              src={gameCoverUrl}
              alt={listing.game.title}
              className="w-full h-full"
              imgClassName="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              placeholderSrc="/placeholder/game.svg"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Status indicators - top right */}
            <div className="absolute top-3 right-3 flex gap-2">
              {listing.status === ApprovalStatus.PENDING && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-amber-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Pending
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Pending approval</TooltipContent>
                </Tooltip>
              )}
              {listing.isVerifiedDeveloper && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-blue-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                      ✓ Verified
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Verified Developer</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Performance badge - bottom left overlay */}
            <PerformanceBadge
              rank={listing.performance?.rank ?? 8}
              label={listing.performance?.label ?? 'N/A'}
              description={listing.performance?.description}
              className="absolute bottom-3 left-3 shadow-lg"
            />

            {/* Quick action - top left */}
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToGame}
              className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-gray-900 shadow-lg"
              aria-label={`View game: ${listing.game.title}`}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {/* Card Content */}
          <div className="p-4">
            {/* Title and System */}
            <div className="mb-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                    {listing.game.title}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>{listing.game.title}</TooltipContent>
              </Tooltip>

              <div className="flex items-center gap-2 mt-1">
                {listing.game.system?.key ? (
                  <SystemIcon
                    name={listing.game.system.name}
                    systemKey={listing.game.system.key}
                    size="sm"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {listing.game.system?.name}
                  </span>
                )}
              </div>
            </div>

            {/* Device & Emulator Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Device
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {deviceName}
                </span>
              </div>

              {listing.emulator && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Emulator
                  </span>
                  <EmulatorIcon
                    name={listing.emulator.name}
                    logo={listing.emulator.logo}
                    showLogo={true}
                    size="sm"
                  />
                </div>
              )}
            </div>

            {/* Success Rate */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Success Rate
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {successRate}%
                </span>
              </div>
              <SuccessRateBar
                rate={listing.successRate * 100}
                voteCount={listing._count.votes}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">
                  {listing.author?.name ?? 'Anonymous'}
                </span>
                <span className="mx-1">•</span>
                <span>{formatTimeAgo(listing.createdAt)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'p-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors',
                    isLiked &&
                      'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLike()
                  }}
                  aria-label={isLiked ? 'Unlike' : 'Like'}
                  aria-pressed={isLiked}
                >
                  <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  onClick={(ev) => {
                    ev.stopPropagation()
                    handleComment()
                  }}
                  aria-label="Comment"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* List View */}
          <div className="flex-shrink-0 mr-4 hidden sm:block">
            <div className="w-16 h-16 relative rounded-md overflow-hidden">
              <ProgressiveImage
                src={gameCoverUrl}
                alt={listing.game.title}
                className="w-full h-full"
                imgClassName="object-cover w-full h-full"
                placeholderSrc="/placeholder/game.svg"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {listing.game.title}
              </h3>
              {listing.status === ApprovalStatus.PENDING && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Pending approval</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                {showSystemIcons && listing.game.system?.key ? (
                  <SystemIcon
                    name={listing.game.system.name}
                    systemKey={listing.game.system.key}
                    size="sm"
                  />
                ) : (
                  listing.game.system?.name
                )}
              </span>
              <span className="truncate max-w-[180px]">{deviceName}</span>
              {listing.emulator && (
                <span className="flex items-center">
                  <EmulatorIcon
                    name={listing.emulator.name}
                    logo={listing.emulator.logo}
                    showLogo={true}
                    size="sm"
                  />
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{listing.author?.name ?? 'Anonymous'}</span>
              <span className="mx-1">•</span>
              <span>{formatTimeAgo(listing.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:block">
              <PerformanceBadge
                rank={listing.performance?.rank ?? 8}
                label={listing.performance?.label ?? 'N/A'}
                description={listing.performance?.description}
              />
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <ThumbsUp className="w-3 h-3 text-green-500" />
                <span className="text-xs font-medium">{successRate}%</span>
              </div>
              <SuccessRateBar
                rate={listing.successRate * 100}
                voteCount={listing._count.votes}
                compact={true}
              />
            </div>
          </div>
        </>
      )}
    </SwipeableCard>
  )
}
