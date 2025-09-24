'use client'

import Link from 'next/link'
import { api } from '@/lib/api'

export function HomeStatistics() {
  const statisticsQuery = api.listings.statistics.useQuery()

  const stats = statisticsQuery.data ?? {
    listings: 0,
    pcListings: 0,
    games: 0,
    emulators: 0,
    devices: 0,
  }

  return (
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
              <div className="text-gray-600 dark:text-gray-300 font-semibold">Supported Games</div>
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
  )
}
