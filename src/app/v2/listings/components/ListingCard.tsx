import {
  ExternalLink,
  Clock,
  Heart,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import EmulatorIcon from '@/components/icons/EmulatorIcon'
import SystemIcon from '@/components/icons/SystemIcon'
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

  const navigateToGame = (e: React.MouseEvent) => {
    e.stopPropagation()
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
        'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group',
        viewMode === 'list' ? 'flex items-center p-4' : 'p-0',
      )}
      aria-label={`${gameTitle} on ${deviceName} using ${emulatorName}. Performance: ${performanceLabel}. Success rate: ${successRate}% with ${voteCount} votes.`}
    >
      {viewMode === 'grid' ? (
        <div className="p-4 sm:p-6">
          {/* Card Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {listing.game.system?.name}
                  </span>
                )}
                {listing.status === ApprovalStatus.PENDING && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </TooltipTrigger>
                    <TooltipContent>Pending approval</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToGame}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`View game: ${listing.game.title}`}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {/* Game Cover Image */}
          <div className="mb-3 relative aspect-video rounded-md overflow-hidden">
            <ProgressiveImage
              src={gameCoverUrl}
              alt={listing.game.title}
              className="w-full h-full"
              imgClassName="object-cover w-full h-full"
              placeholderSrc="/placeholder/game.svg"
            />
          </div>

          {/* Device & Emulator */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {deviceName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {listing.emulator && (
                <EmulatorIcon
                  name={listing.emulator.name}
                  logo={listing.emulator.logo}
                  showLogo={true}
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Performance & Success Rate */}
          <div className="flex items-center justify-between mb-3">
            <PerformanceBadge
              rank={listing.performance?.rank ?? 8}
              label={listing.performance?.label ?? 'N/A'}
              description={listing.performance?.description}
            />
            <SuccessRateBar
              rate={listing.successRate * 100}
              voteCount={listing._count.votes}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span>{listing.author?.name ?? 'Anonymous'}</span>
              <span className="mx-1">•</span>
              <span>{formatTimeAgo(listing.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'p-1',
                  isLiked && 'text-red-500 dark:text-red-400',
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  handleLike()
                }}
                aria-label={isLiked ? 'Unlike' : 'Like'}
                aria-pressed={isLiked}
              >
                <Heart className="w-4 h-4" />
                <span className="sr-only">{isLiked ? 'Unlike' : 'Like'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleComment()
                }}
                aria-label="Comment"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="sr-only">Comment</span>
              </Button>
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
