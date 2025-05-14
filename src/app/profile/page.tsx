'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import Link from 'next/link'
import type { Listing } from '@orm'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)

  // Redirect to log in if not authenticated
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Please sign in to view your profile
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You need to be logged in to access this page.
          </p>

          <Link
            href="/login"
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white inline-block px-4 py-2 rounded-md text-sm font-medium"
          >
            Sign In
          </Link>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Don&#39;t have an account?{' '}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const { data: profile, isLoading } = api.users.getProfile.useQuery()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          <p>Error loading profile. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Profile
              </h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {isEditing ? (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    defaultValue={session.user?.name ?? ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={session.user?.email ?? ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={4}
                    defaultValue={''}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </h2>
                  <p className="mt-1 text-lg text-gray-900 dark:text-white">
                    {session.user?.name ?? 'No name provided'}
                  </p>
                </div>

                <div>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </h2>
                  <p className="mt-1 text-lg text-gray-900 dark:text-white">
                    {session.user?.email}
                  </p>
                </div>

                <div>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Role
                  </h2>
                  <p className="mt-1 text-lg text-gray-900 dark:text-white">
                    {session.user?.role || 'User'}
                  </p>
                </div>

                <div>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Bio
                  </h2>
                  <p className="mt-1 text-lg text-gray-900 dark:text-white">
                    No bio available
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-8 py-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Your Activity
            </h2>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                {profile.listings.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {profile.listings.map((listing) => (
                      <div key={listing.id}>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          <Link href={`/listings/${listing.id}`}>
                            {listing.game?.title}
                          </Link>
                        </h3>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-row gap-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      You have not submitted any listings yet.
                    </p>
                    <div className="align-right ml-auto">
                    <Link
                      href="/listings/new"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      Create Listing
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
