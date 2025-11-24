'use client'

import { SignUpButton, useUser } from '@clerk/nextjs'
import { Users, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  HomeActionButtons,
  HomeAppFeatured,
  HomeCommunityMvp,
  HomeFeaturedContent,
  HomePopularEmulators,
  HomeStatistics,
  HomeTrendingDevices,
} from './components'

function Home() {
  const { user } = useUser()

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

        <HomeAppFeatured />

        <HomeTrendingDevices />

        <HomeCommunityMvp />

        <HomeFeaturedContent />

        {/* Call to Action Section */}
        <section className="relative overflow-visible mb-20">
          {/* Background Elements */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 overflow-hidden">
              <div className="h-full w-full bg-cta-glow animate-pulse-slow" />
            </div>
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
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
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
