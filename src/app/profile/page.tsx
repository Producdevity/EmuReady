'use client'

import { formatDate } from '@/utils/date'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ProfileUpload, ApprovalStatusBadge } from '@/components/ui'
import ProfilePageLoader from '@/app/profile/components/ProfilePageLoader'
import ProfilePageUnauthenticated from './components/ProfilePageUnauthenticated'
import ProfilePageError from './components/ProfilePageError'
import { type RouterInput } from '@/types/trpc'
import toast from '@/lib/toast'
import { type Role } from '@orm'
import getErrorMessage from '@/utils/getErrorMessage'

function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const utils = api.useUtils()
  const userQuery = api.users.getProfile.useQuery(undefined, {
    enabled: !!user,
  })

  const updateProfile = api.users.update.useMutation({
    onMutate: async (newData) => {
      // Optimistically update the profile image
      setProfileImage(newData.profileImage ?? null)
    },
    onSuccess: () => {
      utils.users.getProfile.invalidate().catch(console.error)
      toast.success('Profile updated successfully!')
    },
    onError: (error) => {
      // Revert optimistic update on error
      setProfileImage(userQuery.data?.profileImage ?? null)
      console.error('Error updating profile:', error)
      toast.error(`Failed to update profile: ${getErrorMessage(error)}`)
    },
  })

  const handleImageUpload = async (imageUrl: string) => {
    setProfileImage(imageUrl)
    updateProfile.mutate({
      profileImage: imageUrl,
    } satisfies RouterInput['users']['update'])
  }

  if (!isLoaded || (userQuery.isLoading && user)) return <ProfilePageLoader />

  if (!user) return <ProfilePageUnauthenticated />

  if (!userQuery.data) return <ProfilePageError />

  // Get user role from Clerk's publicMetadata
  const userRole = user.publicMetadata?.role as Role | undefined

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

            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3 flex flex-col items-center">
                <ProfileUpload
                  currentImage={profileImage ?? userQuery.data.profileImage}
                  onUploadSuccess={handleImageUpload}
                />
              </div>

              {/* Profile Details */}
              <div className="md:w-2/3">
                {isEditing ? (
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user.fullName ?? ''}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={
                          user.primaryEmailAddress?.emailAddress ?? ''
                        }
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
                        {user.fullName ?? 'No name provided'}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </h2>
                      <p className="mt-1 text-lg text-gray-900 dark:text-white">
                        {user.primaryEmailAddress?.emailAddress ??
                          'No email provided'}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Role
                      </h2>
                      <p className="mt-1 text-lg text-gray-900 dark:text-white">
                        {userRole ?? 'User'}
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
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-8 py-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Your Activity
            </h2>
            <div className="space-y-6">
              {/* Submitted Games Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Submitted Games
                </h3>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                  {userQuery.data?.submittedGames &&
                  userQuery.data.submittedGames.length > 0 ? (
                    <div className="space-y-3">
                      {userQuery.data.submittedGames.map((game) => (
                        <div
                          key={game.id}
                          className="flex items-center justify-between p-3 rounded border border-gray-100 dark:border-gray-600"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/games/${game.id}`}
                                className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {game.title}
                              </Link>
                              <ApprovalStatusBadge
                                status={game.status}
                                type="game"
                              />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {game.system.name} • Submitted{' '}
                              {formatDate(game.submittedAt!)}
                              {game.approvedAt &&
                                ` • Approved ${formatDate(game.approvedAt)}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600 dark:text-gray-300">
                        You haven&apos;t submitted any games yet.
                      </p>
                      <Link
                        href="/games/new"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Submit Game
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Listings Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Listings
                </h3>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                  {userQuery.data.listings.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {userQuery.data.listings.map((listing) => (
                        <div key={listing.id} className="flex flex-row gap-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            <Link href={`/listings/${listing.id}`}>
                              {listing.game?.title}
                            </Link>
                          </h3>
                          <p className="align-right ml-auto text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(listing.createdAt)}
                          </p>
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
    </div>
  )
}

export default ProfilePage
