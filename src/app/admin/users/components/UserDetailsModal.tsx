import {
  User,
  ShieldUser,
  Calendar,
  Activity,
  ThumbsUp,
  GamepadIcon,
  Copy,
  ExternalLink,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Modal, Button, Badge, LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import { type Nullable } from '@/types/utils'
import { getRoleVariant } from '@/utils/badgeColors'
import { formatDate, formatTimeAgo } from '@/utils/date'
import getErrorMessage from '@/utils/getErrorMessage'

interface Props {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

function UserDetailsModal(props: Props) {
  const userQuery = api.users.getUserById.useQuery(
    { userId: props.userId! },
    { enabled: !!props.userId },
  )

  const copyToClipboard = (text: Nullable<string>) => {
    if (!text) return toast.error('No user ID to copy')

    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Copied to clipboard!'))
      .catch((error) => {
        console.error('Failed to copy user ID: ', error)
        toast.error(`Failed to copy user ID: ${getErrorMessage(error)}`)
      })
  }

  if (!props.isOpen) return null

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={`User Details: ${userQuery.data?.name ?? 'Loading...'}`}
      className="max-w-4xl"
    >
      {userQuery.isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {userQuery.error && (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">
            Failed to load user details: {userQuery.error.message}
          </p>
        </div>
      )}

      {userQuery.data && (
        <div className="relative">
          {/* Header with Gradient Background */}
          <div className="relative h-32 bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-500 rounded-t-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* User Avatar and Basic Info */}
            <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4">
              <div className="relative">
                {userQuery.data.profileImage ? (
                  <Image
                    src={userQuery.data.profileImage}
                    alt={userQuery.data.name ?? 'User'}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full border-4 border-white/20 object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
                  {userQuery.data.name ?? 'Unknown User'}
                </h1>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={getRoleVariant(userQuery.data.role)}
                    className="text-xs"
                  >
                    {userQuery.data.role}
                  </Badge>
                  <span className="text-white/80 text-sm">
                    Member since {formatDate(userQuery.data.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <GamepadIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Listings
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {userQuery.data.listings.length}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Votes Cast
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {userQuery.data.votes.length}
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg md:col-span-1 col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Account Age
                  </span>
                </div>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {formatTimeAgo(userQuery.data.createdAt)}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Information
                </h3>

                <div className="space-y-3">
                  {/* User ID */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        User ID
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                          {userQuery.data.id.slice(0, 8)}...
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(userQuery.data?.id ?? null)
                          }
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                          title="Copy User ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Role
                      </span>
                      <div className="flex items-center gap-2">
                        <ShieldUser className="w-4 h-4 text-gray-500" />
                        <Badge variant={getRoleVariant(userQuery.data.role)}>
                          {userQuery.data.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Join Date */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      Member Since
                    </span>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(userQuery.data.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(userQuery.data.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Summary
                </h3>

                <div className="space-y-3">
                  {/* Recent Listings */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Performance Listings
                      </span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                        {userQuery.data.listings.length} total
                      </span>
                    </div>

                    {userQuery.data.listings.length > 0 ? (
                      <div className="space-y-1">
                        {userQuery.data.listings.slice(0, 3).map((listing) => (
                          <div
                            key={listing.id}
                            className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between"
                          >
                            <span className="truncate">
                              {listing.game.title} on{' '}
                              {listing.device.brand.name}{' '}
                              {listing.device.modelName}
                            </span>
                            <span className="text-gray-500 ml-2">
                              {listing.performance.label}
                            </span>
                          </div>
                        ))}
                        {userQuery.data.listings.length > 3 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            +{userQuery.data.listings.length - 3} more...
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No performance listings yet
                      </p>
                    )}
                  </div>

                  {/* Voting Activity */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Voting Activity
                      </span>
                      <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                        {userQuery.data.votes.length} votes
                      </span>
                    </div>

                    {userQuery.data.votes.length > 0 ? (
                      <div className="space-y-1">
                        {userQuery.data.votes.slice(0, 3).map((vote) => (
                          <div
                            key={vote.id}
                            className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between"
                          >
                            <span className="truncate">
                              {vote.listing.game.title}
                            </span>
                            <span
                              className={cn(
                                'ml-2',
                                vote.value ? 'text-green-600' : 'text-red-600',
                              )}
                            >
                              {vote.value ? '👍' : '👎'}
                            </span>
                          </div>
                        ))}
                        {userQuery.data.votes.length > 3 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            +{userQuery.data.votes.length - 3} more votes...
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No votes cast yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Link
                href={`/users/${userQuery.data.id}`}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Profile
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={props.onClose}
                className="min-w-[100px]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default UserDetailsModal
