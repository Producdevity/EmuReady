'use client'

import { SignUpButton, useUser } from '@clerk/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ThumbsUp,
  MessageCircle,
  Gamepad2,
  Shield,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  Monitor,
  TrendingUp,
  Trophy,
  Award,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { SuccessRateBar, LoadingSpinner, PerformanceBadge } from '@/components/ui'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatters, getLocale } from '@/utils/date'
import getImageUrl from '@/utils/getImageUrl'

const contributorTabs = [
  { id: 'allTime' as const, label: 'All Time' },
  { id: 'thisMonth' as const, label: 'This Month' },
  { id: 'thisWeek' as const, label: 'This Week' },
]

type ContributorTab = (typeof contributorTabs)[number]['id']

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

function Home() {
  const { user } = useUser()
  const listingsQuery = api.listings.featured.useQuery()
  const statisticsQuery = api.listings.statistics.useQuery()
  const topContributorsQuery = api.users.topContributorsSummary.useQuery({ limit: 3 })

  const stats = statisticsQuery.data ?? {
    listings: 0,
    pcListings: 0,
    games: 0,
    emulators: 0,
    devices: 0,
  }

  const [activeContributorRange, setActiveContributorRange] = useState<ContributorTab>('thisMonth')

  const contributors = topContributorsQuery.data?.[activeContributorRange] ?? []
  const isContributorsLoading = topContributorsQuery.isPending

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      <div className="container mx-auto px-4 pb-8">
        {/* Hero Section */}
        <section className="relative py-10 mb-10 overflow-visible">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
          </div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 -z-20 opacity-30">
            <div className="h-full w-full bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px]" />
          </div>

          <div className="text-center relative z-10 max-w-6xl mx-auto">
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg mb-8 animate-[fadeInUp_0.8s_ease-out_0.3s_both]">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Community Driven Platform
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
              <span className="inline-block animate-pulse">Know</span>{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-600 bg-clip-text text-transparent inline-block transform hover:scale-105 transition-transform duration-300">
                before
              </span>{' '}
              <span className="inline-block animate-pulse delay-150">you</span>{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 dark:from-purple-400 dark:via-pink-400 dark:to-red-400 bg-clip-text text-transparent inline-block transform hover:scale-105 transition-transform duration-300">
                load
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto font-medium leading-relaxed">
              The largest{' '}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                community-driven
              </span>{' '}
              hub for tracking{' '}
              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                emulation compatibility
              </span>{' '}
              across devices, emulators, and platforms.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16 px-2 sm:px-4">
              <Link
                href="/pc-listings"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-blue-500/25 transition duration-300 transform hover:scale-105 hover:shadow-blue-500/40"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Browse PC Compatibility
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-600 blur opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
              </Link>

              <Link
                href="/listings"
                className="group relative px-8 py-4 bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-green-500/25 transition duration-300 transform hover:scale-105 hover:shadow-green-500/40"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  Browse Handheld Compatibility
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400 to-green-600 blur opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
              </Link>

              {!user && (
                <SignUpButton>
                  <button
                    type="button"
                    className="group relative px-8 py-4 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm transition duration-300 transform hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Join the Community
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                </SignUpButton>
              )}
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Trusted Reports
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                  Real testing from real users across devices
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Performance Metrics
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                  Detailed compatibility and performance data
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Community Driven
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                  Built by gamers, for gamers worldwide
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2 sm:px-4">
            <Link
              href="/listings"
              className="group p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition duration-500 transform hover:scale-105 text-center cursor-pointer"
            >
              {statisticsQuery.isPending ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
                </div>
              ) : (
                <>
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                    {(stats.listings + stats.pcListings).toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-semibold">
                    Compatibility Reports
                  </div>
                  <div className="mt-2 w-12 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto group-hover:w-16 transition-[width] duration-300" />
                </>
              )}
            </Link>

            <Link
              href="/games"
              className="group p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition duration-500 transform hover:scale-105 text-center cursor-pointer"
            >
              {statisticsQuery.isPending ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
                </div>
              ) : (
                <>
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stats.games.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-semibold">
                    Supported Games
                  </div>
                  <div className="mt-2 w-12 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mx-auto group-hover:w-16 transition-[width] duration-300" />
                </>
              )}
            </Link>

            <Link
              href="/emulators"
              className="group p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition duration-500 transform hover:scale-105 text-center cursor-pointer"
            >
              {statisticsQuery.isPending ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
                </div>
              ) : (
                <>
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stats.emulators.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-semibold">Emulators</div>
                  <div className="mt-2 w-12 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full mx-auto group-hover:w-16 transition-[width] duration-300" />
                </>
              )}
            </Link>

            <Link
              href="/devices"
              className="group p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition duration-500 transform hover:scale-105 text-center cursor-pointer"
            >
              {statisticsQuery.isPending ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
                </div>
              ) : (
                <>
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stats.devices.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-semibold">Handhelds</div>
                  <div className="mt-2 w-12 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full mx-auto group-hover:w-16 transition-[width] duration-300" />
                </>
              )}
            </Link>
          </div>
        </section>

        {/* Community MVPs */}
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
              <div className="flex w-full items-center justify-around gap-2 rounded-full bg-gray-100 p-1 text-sm font-medium dark:bg-gray-900/70 lg:w-auto">
                {contributorTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveContributorRange(tab.id)}
                    className={cn(
                      activeContributorRange === tab.id
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
                      'rounded-full px-4 py-1.5 transition-colors',
                    )}
                    aria-pressed={activeContributorRange === tab.id}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              {isContributorsLoading ? (
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
                        ? formatters.timeAgo(
                            contributor.contributions.lastContributionAt,
                            getLocale(),
                          )
                        : 'No recent activity'

                      const theme = rankThemes[contributor.rank - 1] ?? {
                        numberClass: 'text-blue-600 dark:text-blue-300',
                        badgeClass:
                          'from-blue-200 via-blue-300 to-blue-400 dark:from-blue-500 dark:via-blue-600 dark:to-blue-500',
                        badgeTextClass: 'text-blue-900 dark:text-white',
                        cardClass: 'ring-1 ring-blue-400/30 dark:ring-blue-500/40 shadow-lg',
                      }

                      const totalListings =
                        contributor.contributions.listings + contributor.contributions.pcListings

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
                              {totalListings.toLocaleString()} total
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
                                {contributor.contributions.listings}
                              </span>
                              <span className="text-[11px] uppercase tracking-wide">Handheld</span>
                            </div>
                            <div className="rounded-lg bg-purple-50/80 p-3 dark:bg-purple-900/30">
                              <Monitor className="mx-auto mb-1 h-4 w-4 text-purple-600 dark:text-purple-300" />
                              <span className="block font-semibold text-gray-900 dark:text-white">
                                {contributor.contributions.pcListings}
                              </span>
                              <span className="text-[11px] uppercase tracking-wide">PC</span>
                            </div>
                            <div className="rounded-lg bg-amber-50/80 p-3 dark:bg-amber-900/30">
                              <TrendingUp className="mx-auto mb-1 h-4 w-4 text-amber-600 dark:text-amber-300" />
                              <span className="block font-semibold text-gray-900 dark:text-white">
                                {contributor.trustScore.toLocaleString()}
                              </span>
                              <span className="text-[11px] uppercase tracking-wide">
                                Trust Score
                              </span>
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

        {/* Featured Content */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Latest Compatibility Reports
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover what&apos;s working well across different devices and emulators
            </p>
          </div>

          {listingsQuery.isPending ? (
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner text="Loading featured content..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2 sm:px-4">
              {(listingsQuery.data ?? []).map((listing) => (
                <div
                  key={listing.id}
                  className="group bg-white/80 dark:bg-gray-800/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-500 transform hover:scale-[1.02] backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="relative overflow-hidden">
                    <Image
                      src={getImageUrl(listing.game.imageUrl, listing.game.title)}
                      alt={listing.game.title}
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3 min-h-[3.5rem]">
                      <h3 className="font-semibold text-gray-900 dark:text-white break-words leading-tight min-h-[2.5rem] flex items-center">
                        <Link href={`/listings/${listing.id}`}>{listing.game.title}</Link>
                      </h3>
                      <PerformanceBadge
                        rank={listing.performance?.rank ?? 0}
                        label={listing.performance?.label ?? 'N/A'}
                        description={listing.performance?.description}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span>
                        {listing.game.system?.id ? (
                          <Link
                            href={`/listings?systemId=${listing.game.system.id}`}
                            className="text-blue-600 dark:text-indigo-400 hover:underline"
                          >
                            {listing.game.system.name}
                          </Link>
                        ) : (
                          'Unknown System'
                        )}
                      </span>
                      <span>
                        {listing.emulator?.id ? (
                          <Link
                            href={`/listings?emulatorId=${listing.emulator.id}`}
                            className="text-blue-600 dark:text-indigo-400 hover:underline"
                          >
                            {listing.emulator.name}
                          </Link>
                        ) : (
                          'Unknown Emulator'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span>
                        {listing.device?.id ? (
                          <Link
                            href={`/listings?deviceId=${listing.device.id}`}
                            className="text-blue-600 dark:text-indigo-400 hover:underline"
                          >
                            {listing.device.brand.name} {listing.device.modelName}
                          </Link>
                        ) : (
                          'Unknown Device'
                        )}
                      </span>
                      <span>
                        {listing.performance?.id ? (
                          <Link
                            href={`/listings?performanceId=${listing.performance.id}`}
                            className="text-blue-600 dark:text-indigo-400 hover:underline"
                          >
                            {listing.performance.label}
                          </Link>
                        ) : (
                          'N/A'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span>
                        by{' '}
                        <Link
                          href={`/users/${listing.author?.id}`}
                          className="text-blue-600 dark:text-indigo-400 hover:underline"
                        >
                          {listing.author?.name ?? 'Anonymous'}
                        </Link>
                      </span>
                    </div>
                    {/* Success Rate Bar and Stats */}
                    <div className="flex flex-col gap-1 mt-4">
                      <SuccessRateBar
                        rate={listing.successRate * 100}
                        voteCount={listing._count.votes}
                        hideVoteCount={false}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                      <span title="Votes" className="flex items-center gap-1">
                        <ThumbsUp className="inline w-4 h-4 text-blue-400" />
                        {listing._count?.votes ?? 0} votes
                      </span>
                      <span title="Comments" className="flex items-center gap-1">
                        <MessageCircle className="inline w-4 h-4 text-indigo-400" />
                        {listing._count?.comments ?? 0} comments
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Call to Action Section - Updated design */}
        <section className="relative overflow-visible mb-16">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />
          </div>

          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-white/80 via-blue-50/80 to-purple-50/80 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-600 bg-clip-text text-transparent">
                  Help Build
                </span>{' '}
                the Community
              </h2>
              <p
                className={cn(
                  'text-xl text-gray-600 dark:text-gray-300 leading-relaxed',
                  !user && 'mb-10',
                )}
              >
                Submit your own compatibility reports and help others find the best gaming
                experience on their devices.
              </p>
              {!user && (
                <SignUpButton>
                  <button
                    type="button"
                    className="group relative px-10 py-5 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 text-white font-bold text-xl rounded-2xl shadow-2xl shadow-blue-500/25 transition duration-300 transform hover:scale-105 hover:shadow-blue-500/40"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      <Users className="w-6 h-6" />
                      Create an Account
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 blur opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
                  </button>
                </SignUpButton>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
