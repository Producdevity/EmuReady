'use client'

import { SignUpButton, useUser } from '@clerk/nextjs'
import { ArrowRight, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HomeJoinTheCommunity() {
  const { user } = useUser()

  return (
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
            Submit your own compatibility reports and help others find the best gaming experience on
            their devices.
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
  )
}
