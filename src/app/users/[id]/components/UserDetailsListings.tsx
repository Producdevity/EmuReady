import Link from 'next/link'
import { LocalizedDate } from '@/components/ui'
import type { RouterOutput } from '@/types/trpc'

type UserProfile = RouterOutput['users']['getUserById']
type UserListing = NonNullable<UserProfile>['listings']['items'][0]

interface Props {
  listings: UserListing[]
}

function UserDetailsListings(props: Props) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Listings</h3>
      <div className="space-y-4">
        {props.listings.length > 0 ? (
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
            <div className="flex flex-col gap-4">
              {props.listings.map((listing: UserListing) => (
                <div key={listing.id} className="flex flex-row gap-4 items-center">
                  {/* Game Placeholder */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <span className="text-2xl">🎮</span>
                    </div>
                  </div>

                  {/* Game Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      <Link href={`/listings/${listing.id}`} className="hover:underline">
                        {listing.game?.title}
                      </Link>
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      on {listing.device?.brand.name} {listing.device?.modelName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Performance: {listing.performance?.label}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <LocalizedDate date={listing.createdAt} format="date" />
                    </p>
                  </div>
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
  )
}

export default UserDetailsListings
