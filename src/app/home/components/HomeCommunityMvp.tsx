'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Award, Gamepad2, Monitor, TrendingUp, Trophy } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatters, getLocale } from '@/utils/date'
import { TimeRangeTabs, type TimeRangeId } from './TimeRangeTabs'

const rankThemes = [
  {
    numberClass: 'text-amber-500 dark:text-amber-200',
    badgeClass:
      'from-amber-200 via-amber-300 to-amber-400 dark:from-amber-500 dark:via-amber-600 dark:to-amber-500',
    badgeTextClass: 'text-amber-900 dark:text-gray-50',
    cardClass:
      'ring-2 ring-amber-300/70 dark:ring-amber-400/60 shadow-[0_32px_70px_-36px_rgba(245,158,11,0.65)]',
  },
  {
    numberClass: 'text-slate-500 dark:text-slate-200',
    badgeClass:
      'from-slate-200 via-slate-300 to-slate-400 dark:from-slate-500 dark:via-slate-600 dark:to-slate-700',
    badgeTextClass: 'text-slate-900 dark:text-slate-100',
    cardClass:
      'ring-2 ring-slate-400/70 dark:ring-slate-500/60 shadow-[0_32px_70px_-36px_rgba(148,163,184,0.75)]',
  },
  {
    numberClass: 'text-orange-600 dark:text-orange-200',
    badgeClass:
      'from-orange-200 via-amber-300 to-orange-400 dark:from-orange-500 dark:via-amber-500 dark:to-orange-500',
    badgeTextClass: 'text-amber-900 dark:text-white',
    cardClass:
      'ring-2 ring-orange-200/70 dark:ring-amber-500/60 shadow-[0_32px_70px_-36px_rgba(234,88,12,0.55)]',
  },
]

export function HomeCommunityMvp() {
  const topContributorsQuery = api.users.topContributorsSummary.useQuery({ limit: 3 })

  const [activeContributorRange, setActiveContributorRange] = useState<TimeRangeId>('thisMonth')

  const contributors = useMemo(
    () => topContributorsQuery.data?.[activeContributorRange] ?? [],
    [topContributorsQuery, activeContributorRange],
  )

  return (
    <section className="mb-20 px-2 sm:px-4">
      <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
              <Trophy className="h-4 w-4" />
              Community MVPs
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
              Spotlight on Top Contributors
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
              These contributors keep EmuReady updated with the latest compatibility reports and
              verified game data. Check out their profiles to see their work, give useful
              compatibility reports an upvote, or share your feedback.
            </p>
          </div>
          <TimeRangeTabs value={activeContributorRange} onChange={setActiveContributorRange} />
        </div>

        <div className="mt-8">
          {topContributorsQuery.isPending ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={`contributor-skeleton-${index}`}
                  className="min-h-[14rem] rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/70"
                >
                  <div className="h-full animate-pulse space-y-4">
                    <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-20 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : contributors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center text-gray-600 dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-300">
              Contributions are being tallied—check back soon to meet our community MVPs.
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeContributorRange}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="grid grid-cols-1 gap-6 lg:grid-cols-3"
              >
                {contributors.map((contributor) => {
                  const lastContributionLabel = contributor.contributions.lastContributionAt
                    ? formatters.timeAgo(contributor.contributions.lastContributionAt, getLocale())
                    : 'No recent activity'

                  const theme = rankThemes[contributor.rank - 1] ?? {
                    numberClass: 'text-blue-600 dark:text-blue-300',
                    badgeClass:
                      'from-blue-200 via-blue-300 to-blue-400 dark:from-blue-500 dark:via-blue-600 dark:to-blue-500',
                    badgeTextClass: 'text-blue-900 dark:text-white',
                    cardClass: 'ring-1 ring-blue-400/30 dark:ring-blue-500/40 shadow-lg',
                  }

                  const timeframeHandheld = contributor.contributions.listings
                  const timeframePc = contributor.contributions.pcListings
                  const lifetimeHandheld = contributor.lifetime?.listings ?? timeframeHandheld
                  const lifetimePc = contributor.lifetime?.pcListings ?? timeframePc
                  const lifetimeTotal = lifetimeHandheld + lifetimePc

                  return (
                    <Link
                      key={contributor.id}
                      href={`/users/${contributor.id}`}
                      className={cn(
                        'group flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white/85 p-6 transition duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-800/85',
                        theme.cardClass,
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={cn('text-3xl font-black', theme.numberClass)}>
                            #{contributor.rank}
                          </span>
                          <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow-md dark:border-gray-700">
                            <Image
                              src={contributor.profileImage ?? '/placeholder/profile.svg'}
                              alt={contributor.name ?? 'Community member'}
                              fill
                              sizes="56px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1 rounded-full bg-gradient-to-br px-3 py-1 text-xs font-semibold shadow-sm',
                            theme.badgeClass,
                            theme.badgeTextClass,
                          )}
                        >
                          <Award className="mr-1 inline-block h-3.5 w-3.5" />
                          {lifetimeTotal.toLocaleString()} total
                        </div>
                      </div>

                      <div className="mt-4 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {contributor.name || 'Anonymous Contributor'}
                        </h3>
                        {contributor.bio && (
                          <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                            {contributor.bio}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-gray-600 dark:text-gray-300">
                        <div className="rounded-lg bg-blue-50/80 p-3 dark:bg-blue-900/30">
                          <Gamepad2 className="mx-auto mb-1 h-4 w-4 text-blue-600 dark:text-blue-300" />
                          <span className="block font-semibold text-gray-900 dark:text-white">
                            {timeframeHandheld}
                          </span>
                          <span className="text-[11px] uppercase tracking-wide">Handheld</span>
                        </div>
                        <div className="rounded-lg bg-purple-50/80 p-3 dark:bg-purple-900/30">
                          <Monitor className="mx-auto mb-1 h-4 w-4 text-purple-600 dark:text-purple-300" />
                          <span className="block font-semibold text-gray-900 dark:text-white">
                            {timeframePc}
                          </span>
                          <span className="text-[11px] uppercase tracking-wide">PC</span>
                        </div>
                        <div className="rounded-lg bg-amber-50/80 p-3 dark:bg-amber-900/30">
                          <TrendingUp className="mx-auto mb-1 h-4 w-4 text-amber-600 dark:text-amber-300" />
                          <span className="block font-semibold text-gray-900 dark:text-white">
                            {contributor.trustScore.toLocaleString()}
                          </span>
                          <span className="text-[11px] uppercase tracking-wide">Trust Score</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Last contribution {lastContributionLabel}</span>
                        <span className="inline-flex items-center gap-1 text-blue-600 transition-colors group-hover:text-blue-500 dark:text-blue-300 dark:group-hover:text-blue-200">
                          View profile
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  )
}
