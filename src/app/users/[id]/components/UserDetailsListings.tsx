import type { RouterOutput } from '@/types/trpc'
import { formatDate } from '@/utils/date'
import Link from 'next/link'

type UserProfile = RouterOutput['users']['getUserById']
type UserListing = NonNullable<UserProfile>['listings'][0]

interface Props {
  listings: UserListing[]
}

function UserDetailsListings(props: Props) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
        Listings
      </h3>
      <div className="space-y-4">
        {props.listings.length > 0 ? (
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
            <div className="flex flex-col gap-4">
              {props.listings.map((listing: UserListing) => (
                <div key={listing.id} className="flex flex-row gap-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    <Link href={`/listings/${listing.id}`}>
                      {listing.game?.title} on {listing.device?.brand.name}{' '}
                      {listing.device?.modelName}
                    </Link>
                  </h4>
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
  )
}

export default UserDetailsListings
