import { GamepadIcon, Monitor } from 'lucide-react'
import Link from 'next/link'
import { SystemIcon } from '@/components/icons'
import { Badge, LocalizedDate, PerformanceBadge, SuccessRateBar } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { RouterOutput } from '@/types/trpc'

type UserProfile = RouterOutput['users']['getUserById']
type HandheldListing = UserProfile['listings']['items'][number]
type PcListing = UserProfile['pcListings']['items'][number]

interface HandheldProps {
  report: HandheldListing
  variant: 'handheld'
  viewMode: 'grid' | 'list'
  index: number
}

interface PcProps {
  report: PcListing
  variant: 'pc'
  viewMode: 'grid' | 'list'
  index: number
}

type Props = HandheldProps | PcProps

function ProfileListingCard(props: Props) {
  const isPC = props.variant === 'pc'

  const href = isPC ? `/pc-listings/${props.report.id}` : `/listings/${props.report.id}`
  const accentColor = isPC ? 'purple' : 'blue'

  const subtitle = isPC ? formatPcSubtitle(props.report) : formatHandheldSubtitle(props.report)

  return (
    <Link
      href={href}
      className={cn(
        'animate-fade-in-up group relative overflow-hidden rounded-2xl border transition-all duration-300',
        'border-gray-200/70 bg-white hover:-translate-y-1 hover:shadow-xl',
        'dark:border-white/[0.06] dark:bg-gray-800/60',
        accentColor === 'blue' && 'hover:border-blue-300 dark:hover:border-blue-500/30',
        accentColor === 'purple' && 'hover:border-purple-300 dark:hover:border-purple-500/30',
        props.viewMode === 'list' ? 'p-4' : 'p-5',
      )}
      style={{ animationDelay: `${props.index * 50}ms` }}
    >
      <div className="relative flex flex-col gap-3">
        {/* System icon */}
        <div className="flex items-start gap-4">
          <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 ring-1 ring-gray-200/80 dark:bg-gray-900/80 dark:ring-white/10">
            {props.report.game?.system?.key ? (
              <SystemIcon
                systemKey={props.report.game.system.key}
                name={props.report.game.system.name}
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

          {/* Title + subtitle */}
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
                  {props.report.game?.title}
                </h3>
                <p className="truncate text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              </div>
              {props.report.performance ? (
                <PerformanceBadge
                  rank={props.report.performance.rank}
                  label={props.report.performance.label}
                  description={props.report.performance.description}
                  pill
                  className="hidden shrink-0 text-sm sm:block"
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          {props.report.emulator?.name ? (
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
              {props.report.emulator.name}
            </Badge>
          ) : null}
          {isPC && 'memorySize' in props.report && (
            <Badge variant="info" size="sm" pill className="shadow-sm">
              {props.report.memorySize} GB RAM
            </Badge>
          )}
          {props.report.performance ? (
            <PerformanceBadge
              rank={props.report.performance.rank}
              label={props.report.performance.label}
              description={props.report.performance.description}
              pill
              className="sm:hidden"
            />
          ) : null}
        </div>

        {/* Footer: time + success rate */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <LocalizedDate date={props.report.createdAt} format="timeAgo" />
          {props.report._count.votes > 0 && (
            <SuccessRateBar
              rate={props.report.successRate * 100}
              voteCount={props.report._count.votes}
              compact
            />
          )}
        </div>
      </div>
    </Link>
  )
}

function formatHandheldSubtitle(report: HandheldListing): string {
  return (
    [report.device?.brand.name, report.device?.modelName].filter(Boolean).join(' ').trim() ||
    'Unknown device'
  )
}

function formatPcSubtitle(report: PcListing): string {
  const cpu = [report.cpu?.brand?.name, report.cpu?.modelName].filter(Boolean).join(' ').trim()
  const gpu = report.gpu
    ? [report.gpu.brand?.name, report.gpu.modelName].filter(Boolean).join(' ').trim()
    : null
  return [cpu, gpu].filter(Boolean).join(' · ') || 'Unknown hardware'
}

export default ProfileListingCard
