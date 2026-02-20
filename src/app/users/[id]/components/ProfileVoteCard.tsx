import { GamepadIcon, ThumbsDown, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import { SystemIcon } from '@/components/icons'
import { Badge, LocalizedDate, PerformanceBadge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { RouterOutput } from '@/types/trpc'

type Vote = RouterOutput['users']['getUserById']['votes']['items'][number]

interface Props {
  vote: Vote
  viewMode: 'grid' | 'list'
  index: number
}

function ProfileVoteCard(props: Props) {
  const deviceName = [props.vote.listing.device?.brand.name, props.vote.listing.device?.modelName]
    .filter(Boolean)
    .join(' ')
    .trim()

  return (
    <Link
      href={`/listings/${props.vote.listing.id}`}
      className={cn(
        'animate-fade-in-up group relative overflow-hidden rounded-2xl border transition-all duration-300',
        'border-gray-200/70 bg-white hover:-translate-y-1 hover:shadow-xl',
        'dark:border-white/[0.06] dark:bg-gray-800/60',
        'hover:border-blue-300 dark:hover:border-blue-500/30',
        props.viewMode === 'list' ? 'p-4' : 'p-5',
      )}
      style={{ animationDelay: `${props.index * 40}ms` }}
    >
      <div className="relative flex flex-col gap-3">
        <div className="flex items-start gap-3.5">
          {/* System icon */}
          <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 ring-1 ring-gray-200/80 dark:bg-gray-900/80 dark:ring-white/10">
            {props.vote.listing.game?.system?.key ? (
              <SystemIcon
                systemKey={props.vote.listing.game.system.key}
                name={props.vote.listing.game.system.name}
                size="md"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <GamepadIcon className="h-5 w-5" />
              </div>
            )}
          </div>

          {/* Title + subtitle */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                  {props.vote.listing.game?.title}
                </h3>
                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                  {deviceName || 'Unknown device'}
                </p>
              </div>
              {props.vote.listing.performance ? (
                <PerformanceBadge
                  rank={props.vote.listing.performance.rank}
                  label={props.vote.listing.performance.label}
                  description={props.vote.listing.performance.description}
                  pill
                  className="hidden shrink-0 text-sm sm:block"
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={props.vote.value ? 'success' : 'danger'}
            size="sm"
            pill
            className="shadow-sm"
          >
            {props.vote.value ? (
              <ThumbsUp className="mr-1 h-3 w-3" />
            ) : (
              <ThumbsDown className="mr-1 h-3 w-3" />
            )}
            {props.vote.value ? 'Upvoted' : 'Downvoted'}
          </Badge>
          {props.vote.listing.emulator?.name ? (
            <Badge
              variant="primary"
              size="sm"
              pill
              className="shadow-sm dark:bg-blue-900/40 dark:text-blue-200"
            >
              {props.vote.listing.emulator.name}
            </Badge>
          ) : null}
          {props.vote.listing.performance ? (
            <PerformanceBadge
              rank={props.vote.listing.performance.rank}
              label={props.vote.listing.performance.label}
              description={props.vote.listing.performance.description}
              pill
              className="sm:hidden"
            />
          ) : null}
        </div>

        {/* Footer: time */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <LocalizedDate date={props.vote.createdAt} format="timeAgo" />
        </div>
      </div>
    </Link>
  )
}

export default ProfileVoteCard
