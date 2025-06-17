import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { RouterOutput } from '@/types/trpc'

type UserProfile = RouterOutput['users']['getUserById']
type UserVote = NonNullable<UserProfile>['votes']['items'][0]

interface Props {
  votes: UserVote[]
}

function UserDetailsContributions(props: Props) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
        Votes and Contributions
      </h3>
      <div className="space-y-4">
        {props.votes.length > 0 ? (
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
            <div className="flex flex-col gap-4">
              {props.votes.map((vote: UserVote) => (
                <div key={vote.id} className="flex flex-row gap-4">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                      vote.value
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                    )}
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
  )
}

export default UserDetailsContributions
