'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { TrendingUp, ChevronRight, Smartphone, Cpu } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { RetroCatalogIndicator } from '@/components/retrocatalog'
import { HOME_PAGE_LIMITS } from '@/data/constants'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { TimeRangeTabs, type TimeRangeId } from './TimeRangeTabs'

const TIME_RANGE_LABELS: Record<TimeRangeId, string> = {
  allTime: 'All Time',
  thisMonth: 'This Month',
  thisWeek: 'This Week',
}

export function HomeTrendingDevices() {
  const trendingDevicesQuery = api.devices.trendingSummary.useQuery({
    limit: HOME_PAGE_LIMITS.TRENDING_DEVICES,
  })

  const [activeTimeRange, setActiveTimeRange] = useState<TimeRangeId>('thisMonth')

  const devices = useMemo(
    () => trendingDevicesQuery.data?.[activeTimeRange] ?? [],
    [trendingDevicesQuery.data, activeTimeRange],
  )

  return (
    <section className="mb-20 px-2 sm:px-4">
      <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-8 lg:mb-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
              Trending {TIME_RANGE_LABELS[activeTimeRange]}
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
              Popular Devices
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
              Discover the most active handheld gaming devices. These are the devices getting the
              most new compatibility reports from our community.
            </p>
          </div>
          <TimeRangeTabs value={activeTimeRange} onChange={setActiveTimeRange} />
        </div>

        {trendingDevicesQuery.isPending ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(HOME_PAGE_LIMITS.TRENDING_DEVICES)].map((_, index) => (
              <div
                key={`device-skeleton-${index}`}
                className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/70"
              >
                <div className="h-full animate-pulse space-y-3">
                  <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center text-gray-600 dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-300">
            No trending devices for this time period. Be the first to contribute!
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTimeRange}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {devices.map((device, index) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                >
                  <Link
                    href={`/listings?deviceIds=${device.id}`}
                    onClick={() => {
                      analytics.contentDiscovery.homeDeviceClicked({
                        deviceId: device.id,
                        brandName: device.brandName,
                        modelName: device.modelName,
                        socName: device.socName ?? undefined,
                        recentListingCount: device.recentListingCount,
                      })
                    }}
                    className={cn(
                      'group relative flex flex-col rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50/80 p-4 shadow-md backdrop-blur-sm',
                      'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200',
                      'dark:border-gray-700/80 dark:from-gray-800/80 dark:to-gray-900/80 dark:hover:border-emerald-700',
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                          <Smartphone className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">
                            {device.brandName} {device.modelName}
                          </h3>
                        </div>
                      </div>
                      <RetroCatalogIndicator
                        size="md"
                        brandName={device.brandName}
                        modelName={device.modelName}
                        className="flex-shrink-0"
                      />
                    </div>

                    <div className="mb-3 flex-1">
                      {device.socName && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <Cpu className="h-3.5 w-3.5" />
                          <span className="truncate">{device.socName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 dark:bg-emerald-900/30">
                        <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {device.recentListingCount}{' '}
                          {activeTimeRange === 'allTime' ? 'total' : 'new'}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-emerald-500 dark:text-gray-500 dark:group-hover:text-emerald-400" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {devices.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/listings"
              onClick={() => {
                analytics.contentDiscovery.homeViewAllClicked({ section: 'devices' })
              }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl"
            >
              View All Handheld Compatibility Reports
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
