'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Flame, ChevronRight, Smartphone, Monitor } from 'lucide-react'
import Link from 'next/link'
import { EmulatorIcon } from '@/components/icons'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export function HomePopularEmulators() {
  const trendingEmulatorsQuery = api.emulators.trending.useQuery()

  const emulators = trendingEmulatorsQuery.data ?? []

  return (
    <section className="mb-12 sm:mb-16 md:mb-20 px-2 sm:px-4">
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200/60 bg-white/80 p-4 sm:p-6 lg:p-8 shadow-xl backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600 dark:bg-orange-900/30 dark:text-orange-300">
            <Flame className="h-4 w-4" />
            Trending Now
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Most Popular Emulators
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
            Explore the most trending emulators in our community. Click any emulator to see all
            compatibility reports and find the recommended settings for your games.
          </p>
        </div>

        {trendingEmulatorsQuery.isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-3 md:grid-cols-4">
            {[...Array(12)].map((_, index) => (
              <div
                key={`emulator-skeleton-${index}`}
                className="aspect-[3/4] flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-gray-200 bg-white/70 p-3 sm:p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/70"
              >
                <div className="h-full w-full animate-pulse space-y-3 sm:space-y-4">
                  <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 sm:h-5 w-full rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : emulators.length === 0 ? (
          <div className="rounded-xl sm:rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6 sm:p-8 text-center text-sm sm:text-base text-gray-600 dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-300">
            No emulator data available yet. Be the first to contribute!
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4"
            >
              {emulators.map((emulator, index) => {
                const systemText =
                  emulator.systems.length === 0
                    ? 'Multi-System'
                    : emulator.systems.length === 1
                      ? emulator.systems[0]
                      : emulator.systems.length === 2
                        ? emulator.systems.join(' & ')
                        : `${emulator.systems[0]} +${emulator.systems.length - 1}`

                return (
                  <motion.div
                    key={emulator.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="aspect-[3/4]"
                  >
                    <div
                      className={cn(
                        'group relative flex flex-col items-center',
                        'rounded-xl sm:rounded-2xl bg-gradient-to-br',
                        'from-white/90 to-gray-50/90 dark:from-slate-800/90 dark:to-slate-900/90',
                        'p-2 sm:p-3 md:p-4',
                        'transition-all duration-500 ease-out hover:-translate-y-2',
                        'overflow-hidden h-full w-full',
                        'backdrop-blur-md shadow-md hover:shadow-2xl',
                        'border border-gray-200/60 hover:border-gray-300/80',
                        'dark:border-slate-700/50 dark:hover:border-slate-600/60',
                      )}
                    >
                      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-all duration-500 group-hover:opacity-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-500/25 dark:via-purple-500/25 dark:to-pink-500/25 backdrop-blur-xl" />
                      </div>

                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl opacity-0 transition-all duration-300 group-hover:opacity-100">
                        <Link
                          href={`/listings?emulatorIds=${emulator.id}`}
                          onClick={() => {
                            analytics.contentDiscovery.homeEmulatorClicked({
                              emulatorId: emulator.id,
                              emulatorName: emulator.name,
                              systemCount: emulator.systems.length,
                              listingCount: emulator.listingCount,
                              actionType: 'handheld',
                            })
                          }}
                          className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-cyan-600 hover:shadow-xl"
                        >
                          <Smartphone className="h-4 w-4 flex-shrink-0" />
                          <span>Handheld</span>
                        </Link>
                        <Link
                          href={`/pc-listings?emulatorIds=${emulator.id}`}
                          onClick={() => {
                            analytics.contentDiscovery.homeEmulatorClicked({
                              emulatorId: emulator.id,
                              emulatorName: emulator.name,
                              systemCount: emulator.systems.length,
                              listingCount: emulator.listingCount,
                              actionType: 'pc',
                            })
                          }}
                          className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-purple-600 hover:to-pink-600 hover:shadow-xl"
                        >
                          <Monitor className="h-4 w-4 flex-shrink-0" />
                          <span>PC</span>
                        </Link>
                      </div>

                      <div className="relative z-10 flex w-full flex-col items-center justify-between h-full py-1 sm:py-2 md:py-3 min-h-0">
                        <div className="flex-shrink-0 transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-2 mb-2 sm:mb-3">
                          <div className="relative h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24">
                            <EmulatorIcon
                              logo={emulator.logo}
                              name={emulator.name}
                              size="lg"
                              showLogo={true}
                              className="!w-full !h-full !bg-transparent !p-0"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-0.5 sm:gap-1 md:gap-1.5 w-full min-h-0 flex-shrink">
                          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 dark:text-white text-center leading-tight line-clamp-2 w-full px-0.5 sm:px-1 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-200">
                            {emulator.name}
                          </h3>

                          <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-slate-300 text-center line-clamp-1 w-full px-0.5 sm:px-1 transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-slate-200">
                            {systemText}
                          </p>

                          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 mt-0.5 sm:mt-1 rounded-full bg-gray-100/80 dark:bg-slate-700/30 border border-gray-200/80 dark:border-slate-600/20 backdrop-blur-sm transition-all duration-300 group-hover:bg-gray-200/90 dark:group-hover:bg-slate-600/40 group-hover:border-gray-300 dark:group-hover:border-slate-500/30 group-hover:scale-105 flex-shrink-0">
                            <div className="h-1 w-1 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-300 transition-colors whitespace-nowrap">
                              {emulator.listingCount.toLocaleString()} Reports
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {emulators.length > 0 && (
          <div className="mt-8 sm:mt-10 text-center">
            <Link
              href="/emulators"
              onClick={() => {
                analytics.contentDiscovery.homeViewAllClicked({ section: 'emulators' })
              }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-orange-600 hover:to-red-600 hover:shadow-xl hover:scale-105"
            >
              View All Emulators
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
