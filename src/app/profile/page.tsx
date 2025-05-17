'use client'

import ProfilePageLoader from '@/app/profile/components/ProfilePageLoader'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ProfileUpload } from '@/components/ui'
import ProfilePageUnauthenticated from './components/ProfilePageUnauthenticated'
import ProfilePageError from './components/ProfilePageError'

function ProfilePage() {
  const { data: session, status } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  // Always call these hooks, regardless of session state
  const utils = api.useUtils()
  const { data: profile, isLoading } = api.users.getProfile.useQuery(
    undefined,
    { enabled: !!session },
  )

  const updateProfile = api.users.update.useMutation({
    onMutate: async (newData) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await utils.users.getProfile.cancel()

      const previousProfile = utils.users.getProfile.getData()

      utils.users.getProfile.setData(undefined, (old) => {
        if (!old) return old
        return { ...old, ...newData }
      })

      return { previousProfile }
    },
    onError: (err, _newData, context) => {
      utils.users.getProfile.setData(undefined, context?.previousProfile)
      console.error('Error updating profile:', err)
    },
    onSettled: () => {
      utils.users.getProfile.invalidate().catch(console.error) // TODO: handle error correctly
    },
  })

  const handleProfileImageUpload = (imageUrl: string) => {
    setProfileImage(imageUrl)

    updateProfile.mutate({ profileImage: imageUrl })
  }

  if (status === 'loading' || (isLoading && session))
    return <ProfilePageLoader />

  if (status === 'unauthenticated') return <ProfilePageUnauthenticated />

  if (!session || !profile) return <ProfilePageError />

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
                  currentImage={profileImage ?? profile.profileImage}
                  onUploadSuccess={handleProfileImageUpload}
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
                        {session.user?.email ?? 'No email provided'}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Role
                      </h2>
                      <p className="mt-1 text-lg text-gray-900 dark:text-white">
                        {session.user?.role ?? 'User'}
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
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                {profile.listings.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {profile.listings.map((listing) => (
                      <div key={listing.id} className="flex flex-row gap-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          <Link href={`/listings/${listing.id}`}>
                            {listing.game?.title}
                          </Link>
                        </h3>
                        <p className="align-right ml-auto text-sm text-gray-500 dark:text-gray-400">
                          {new Date(listing.createdAt).toLocaleDateString()}
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
  )
}

export default ProfilePage
