'use client'

import { SignUpButton, useUser } from '@clerk/nextjs'
import {
  ThumbsUp,
  MessageCircle,
  Gamepad2,
  Shield,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  SuccessRateBar,
  LoadingSpinner,
  PerformanceBadge,
} from '@/components/ui'
import { api } from '@/lib/api'
import getImageUrl from '@/utils/getImageUrl'

function Home() {
  const { user } = useUser()
  const listingsQuery = api.listings.featured.useQuery()
  const statisticsQuery = api.listings.statistics.useQuery()

  const stats = statisticsQuery.data ?? {
    listings: 0,
    games: 0,
    emulators: 0,
    devices: 0,
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Hero Section */}
        <section className="relative py-10 mb-10 overflow-hidden">
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
              Find the perfect emulator for your device with{' '}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                community-driven
              </span>{' '}
              compatibility reports that help you make{' '}
              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                informed decisions
              </span>
              .
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16 px-2 sm:px-4">
              <Link
                href="/listings"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/40"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  Browse Compatibility Reports
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-600 blur opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
              </Link>

              {!user && (
                <SignUpButton>
                  <button
                    type="button"
                    className="group relative px-8 py-4 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
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
              <div className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
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

              <div className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
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

              <div className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-2 sm:px-4">
            <Link
              href="/listings"
              className="group p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 text-center cursor-pointer"
            >
              {statisticsQuery.isLoading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stats.listings.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-semibold">
                    Compatibility Reports
                  </div>
                  <div className="mt-2 w-12 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto group-hover:w-16 transition-all duration-300" />
                </>
              )}
            </Link>

            <Link
              href="/games"
              className="group p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 text-center cursor-pointer"
            >
              {statisticsQuery.isLoading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stats.games.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-semibold">
                    Supported Games
                  </div>
                  <div className="mt-2 w-12 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mx-auto group-hover:w-16 transition-all duration-300" />
                </>
              )}
            </Link>

            <Link
              href="/emulators"
              className="group p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 text-center cursor-pointer"
            >
              {statisticsQuery.isLoading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stats.emulators.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-semibold">
                    Emulators
                  </div>
                  <div className="mt-2 w-12 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full mx-auto group-hover:w-16 transition-all duration-300" />
                </>
              )}
            </Link>

            <Link
              href="/devices"
              className="group p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 text-center cursor-pointer"
            >
              {statisticsQuery.isLoading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stats.devices.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-semibold">
                    Devices
                  </div>
                  <div className="mt-2 w-12 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full mx-auto group-hover:w-16 transition-all duration-300" />
                </>
              )}
            </Link>
          </div>
        </section>

        {/* Featured Content */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Latest Compatibility Listings
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover what&apos;s working well across different devices and
              emulators
            </p>
          </div>

          {listingsQuery.isLoading ? (
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner text="Loading featured content..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2 sm:px-4">
              {(listingsQuery.data ?? []).map((listing) => (
                <div
                  key={listing.id}
                  className="group bg-white/80 dark:bg-gray-800/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="relative overflow-hidden">
                    <Image
                      src={getImageUrl(
                        listing.game.imageUrl,
                        listing.game.title,
                      )}
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
                        <Link href={`/listings/${listing.id}`}>
                          {listing.game.title}
                        </Link>
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
                            {listing.device.brand.name}{' '}
                            {listing.device.modelName}
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
                      <span
                        title="Comments"
                        className="flex items-center gap-1"
                      >
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
        <section className="relative overflow-hidden mb-16">
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
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
                Submit your own compatibility reports and help others find the
                best gaming experience on their devices.
              </p>
              {!user && (
                <SignUpButton>
                  <button className="group relative px-10 py-5 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 text-white font-bold text-xl rounded-2xl shadow-2xl shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/40">
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
