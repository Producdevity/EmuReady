'use client'

import {} from '@/app/home/components/HomeJoinTheCommunity'
import {
  HomeActionButtons,
  HomeAppFeatured,
  HomeCommunityMvp,
  HomeFeaturedContent,
  HomePopularEmulators,
  HomeStatistics,
  HomeTrendingDevices,
  HomeJoinTheCommunity,
} from './components'

function Home() {
  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      <div className="container mx-auto px-4 pb-8">
        {/* Hero Section */}
        <section className="relative pt-10 mb-20 overflow-visible">
          {/* Background Elements */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 overflow-hidden">
              <div className="h-full w-full bg-hero-glow animate-pulse-slow" />
            </div>
          </div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 -z-20 opacity-30">
            <div className="h-full w-full bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px]" />
          </div>

          <div className="text-center relative z-10 max-w-6xl mx-auto">
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

            <HomeActionButtons />
          </div>
        </section>

        <HomePopularEmulators />

        <HomeStatistics />

        <HomeCommunityMvp />

        <HomeTrendingDevices />

        <HomeAppFeatured />

        <HomeFeaturedContent />

        <HomeJoinTheCommunity />
      </div>
    </div>
  )
}

export default Home
