'use client'

import Link from 'next/link'
import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NotFound() {
  const router = useRouter()

  // Track 404 errors
  useEffect(() => {
    // TODO: Add analytics tracking
    console.error('404 error: Page not found')
  }, [])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-5">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-9xl font-extrabold text-indigo-600 mb-8">404</h1>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          How did you even end up here? Better get moving.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Go Back
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            Go Home
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/listings"
            className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <span className="block text-gray-900 dark:text-white font-medium">
              Listings
            </span>
          </Link>

          <Link
            href="/games"
            className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <span className="block text-gray-900 dark:text-white font-medium">
              Games
            </span>
          </Link>

          <Link
            href="/login"
            className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <span className="block text-gray-900 dark:text-white font-medium">
              Login
            </span>
          </Link>

          <Link
            href="/register"
            className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <span className="block text-gray-900 dark:text-white font-medium">
              Register
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
