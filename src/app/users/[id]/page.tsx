'use client'

import Image from 'next/image'
import { isArray, isString } from 'remeda'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { PageLoading } from '@/components/ui'
import UserDetailsContributions from './components/UserDetailsContributions'
import UserDetailsListings from './components/UserDetailsListings'
import UserDetailsPageError from './components/UserDetailsPageError'
import UserDetailsProfile from './components/UserDetailsProfile'

function UserDetailsPage() {
  const params = useParams()
  const userId = isString(params.id)
    ? params.id
    : isArray(params.id)
      ? params.id[0]
      : ''

  const userQuery = api.users.getUserById.useQuery({ userId })

  if (userQuery.isLoading) return <PageLoading />

  if (userQuery.error || !userQuery.data) {
    return <UserDetailsPageError errorMessage={userQuery.error?.message} />
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
                    src={
                      userQuery.data.profileImage ?? '/placeholder/profile.svg'
                    }
                    alt={`${userQuery.data.name}'s profile picture`}
                    fill
                    sizes="(max-width: 768px) 100vw, 128px"
                    className="object-cover"
                  />
                </div>
              </div>

              <UserDetailsProfile userProfile={userQuery.data} />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-8 py-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Activity
            </h2>

            <UserDetailsListings listings={userQuery.data.listings} />

            <UserDetailsContributions votes={userQuery.data.votes} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDetailsPage
