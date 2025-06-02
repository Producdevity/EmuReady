'use client'

import Link from 'next/link'
import Image from 'next/image'
import { SignUpButton } from '@clerk/nextjs'
import getImageUrl from './games/utils/getImageUrl'
import { SuccessRateBar, LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import {
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'

function Home() {
  const listingsQuery = api.listings.featured.useQuery()

  if (listingsQuery.isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner text="Loading featured content..." />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="py-16 mb-16 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/30 via-blue-400/10 to-transparent pointer-events-none" />
          <div className="text-center relative z-10">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white dark:text-indigo-100 mb-6 drop-shadow-lg tracking-tight">
              Know before you load
            </h1>
            <p className="text-2xl md:text-3xl text-indigo-100 dark:text-indigo-200 mb-10 max-w-3xl mx-auto font-medium">
              Find the perfect emulator for your Android device.
              Community-driven compatibility reports that help you make informed
              decisions.
            </p>
            <div className="flex justify-center space-x-6">
              <Link
                href="/listings"
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Browse Compatibility Reports
              </Link>
              <SignUpButton>
                <span className="bg-white/90 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-700 dark:text-indigo-200 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 transform hover:scale-105">
                  Join the Community
                </span>
              </SignUpButton>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                2,500+
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Compatibility Reports
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600 dark:text-gray-300">
                Supported Games
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10+</div>
              <div className="text-gray-600 dark:text-gray-300">Emulators</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">25+</div>
              <div className="text-gray-600 dark:text-gray-300">
                Android Devices
              </div>
            </div>
          </div>
        </section>

        {/* Featured Content */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Latest Compatibility Listings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(listingsQuery.data ?? []).map((listing) => (
              <div
                key={listing.id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm"
              >
                <Image
                  src={getImageUrl(listing.game.imageUrl, listing.game.title)}
                  alt={listing.game.title}
                  width={400}
                  height={200}
                  className="w-full h-40 object-cover"
                  unoptimized
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3 min-h-[3.5rem]">
                    <h3 className="font-semibold text-gray-900 dark:text-white break-words leading-tight min-h-[2.5rem] flex items-center">
                      <Link href={`/listings/${listing.id}`}>
                        {listing.game.title}
                      </Link>
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        listing.performance?.label === 'Perfect'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                          : listing.performance?.label === 'Great'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                            : listing.performance?.label === 'Playable'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                      }`}
                    >
                      {listing.performance?.label ?? 'N/A'}
                    </span>
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
                      <HandThumbUpIcon className="inline w-4 h-4 text-blue-400" />
                      {listing._count?.votes ?? 0} votes
                    </span>
                    <span title="Comments" className="flex items-center gap-1">
                      <ChatBubbleLeftIcon className="inline w-4 h-4 text-indigo-400" />
                      {listing._count?.comments ?? 0} comments
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-blue-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Help Build the Community</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Submit your own compatibility reports and help others find the best
            gaming experience on their Android devices.
          </p>
          <SignUpButton>
            <span className="cursor-pointer bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all inline-block">
              Create an Account
            </span>
          </SignUpButton>
        </section>
      </div>
    </div>
  )
}

export default Home
