'use client'

import Link from 'next/link'
import Image from 'next/image'
import { isArray, isString } from 'remeda'
import { useParams } from 'next/navigation'
import { formatDate } from '@/utils/date'
import { api } from '@/lib/api'
import type { RouterOutputs } from '@/server/api/root'

type UserProfile = RouterOutputs['users']['getUserById']
type UserListing = UserProfile['listings'][0]
type UserVote = UserProfile['votes'][0]

export default function UserProfilePage() {
  const params = useParams()
  const userId = isString(params.id)
    ? params.id
    : isArray(params.id)
      ? params.id[0]
      : ''

  const {
    data: profile,
    isLoading,
    error,
  } = api.users.getUserById.useQuery({ userId })

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

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          <p>Error loading profile: {error?.message ?? 'User not found'}</p>
          <Link href="/" className="text-red-800 dark:text-red-200 underline">
            Return home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Image */}
              <div className="md:w-1/3 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden border-2 border-gray-300">
                  <Image
                    src={profile.profileImage ?? '/placeholder/profile.svg'}
                    alt={`${profile.name}'s profile picture`}
                    fill
                    sizes="(max-width: 768px) 100vw, 128px"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Profile Details */}
              <div className="md:w-2/3">
                <div className="flex justify-between items-start mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.name}&apos;s Profile
                  </h1>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Name
                    </h2>
                    <p className="mt-1 text-lg text-gray-900 dark:text-white">
                      {profile.name ?? 'No name provided'}
                    </p>
                  </div>

                  <div>
                    <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Member Since
                    </h2>
                    <p className="mt-1 text-lg text-gray-900 dark:text-white">
                      {formatDate(profile.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-8 py-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Activity
            </h2>

            {/* User's listings */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                Listings
              </h3>
              <div className="space-y-4">
                {profile.listings.length > 0 ? (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                    <div className="flex flex-col gap-4">
                      {profile.listings.map((listing: UserListing) => (
                        <div key={listing.id} className="flex flex-row gap-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            <Link href={`/listings/${listing.id}`}>
                              {listing.game?.title} on{' '}
                              {listing.device?.brand.name}{' '}
                              {listing.device?.modelName}
                            </Link>
                          </h3>
                          <p className="align-right ml-auto text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(listing.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                    <p className="text-gray-600 dark:text-gray-300">
                      This user hasn&apos;t submitted any listings yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* User's contributions */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                Votes and Contributions
              </h3>
              <div className="space-y-4">
                {profile.votes.length > 0 ? (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                    <div className="flex flex-col gap-4">
                      {profile.votes.map((vote: UserVote) => (
                        <div key={vote.id} className="flex flex-row gap-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium
                            ${
                              vote.value
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}
                          >
                            {vote.value ? 'Upvoted' : 'Downvoted'}
                          </span>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            <Link href={`/listings/${vote.listing.id}`}>
                              {vote.listing.game?.title} on{' '}
                              {vote.listing.device?.brand.name}{' '}
                              {vote.listing.device?.modelName}
                            </Link>
                          </h3>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                    <p className="text-gray-600 dark:text-gray-300">
                      This user hasn&apos;t voted on any listings yet.
                    </p>
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
