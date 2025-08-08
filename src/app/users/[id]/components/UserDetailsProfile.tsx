import { LocalizedDate } from '@/components/ui'
import type { RouterOutput } from '@/types/trpc'

type UserProfile = RouterOutput['users']['getUserById']

interface Props {
  userProfile: NonNullable<UserProfile>
}

function UserDetailsProfile(props: Props) {
  return (
    <div className="md:w-2/3">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {props.userProfile.name}&apos;s Profile
        </h1>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h2>
          <p className="mt-1 text-lg text-gray-900 dark:text-white">
            {props.userProfile.name ?? 'No name provided'}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</h2>
          <p className="mt-1 text-lg text-gray-900 dark:text-white">
            <LocalizedDate date={props.userProfile.createdAt ?? new Date()} format="date" />
          </p>
        </div>
      </div>
    </div>
  )
}

export default UserDetailsProfile
