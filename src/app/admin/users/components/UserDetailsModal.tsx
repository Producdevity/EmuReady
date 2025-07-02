import {
  User,
  ShieldUser,
  Calendar,
  Activity,
  ThumbsUp,
  GamepadIcon,
  Copy,
  ExternalLink,
  TrendingUp,
  Award,
  Settings,
  Plus,
  Minus,
  Flag,
  Ban,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  Modal,
  Code,
  Button,
  Badge,
  LoadingSpinner,
  Input,
} from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { TRUST_LEVELS } from '@/lib/trust/config'
import { cn } from '@/lib/utils'
import { getRoleVariant, getTrustActionBadgeColor } from '@/utils/badgeColors'
import { copyToClipboard } from '@/utils/copyToClipboard'
import { formatDate, formatTimeAgo } from '@/utils/date'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'

interface Props {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

function UserDetailsModal(props: Props) {
  const utils = api.useUtils()
  const userQuery = api.users.getUserById.useQuery(
    { userId: props.userId! },
    { enabled: !!props.userId },
  )

  // Get current user to check if they're SUPER_ADMIN
  const currentUserQuery = api.users.me.useQuery()
  const isSuperAdmin = hasPermission(
    currentUserQuery.data?.role,
    Role.SUPER_ADMIN,
  )

  // Get ban status and report statistics
  const banStatusQuery = api.userBans.checkUserBanStatus.useQuery(
    { userId: props.userId! },
    { enabled: !!props.userId },
  )

  const reportStatsQuery = api.listingReports.getUserReportStats.useQuery(
    { userId: props.userId! },
    { enabled: !!props.userId },
  )

  // Trust score adjustment state
  const [customAdjustment, setCustomAdjustment] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)

  const adjustTrustScoreMutation = api.trust.adjustTrustScore.useMutation({
    onSuccess: () => {
      toast.success('Trust score adjusted successfully')
      setCustomAdjustment('')
      setAdjustmentReason('')
      setIsAdjusting(false)
      if (!props.userId) return
      utils.users.getUserById
        .invalidate({ userId: props.userId })
        .catch(console.error)
    },
    onError: (error) => {
      toast.error(`Failed to adjust trust score: ${getErrorMessage(error)}`)
      setIsAdjusting(false)
    },
  })

  const handleTrustScoreAdjustment = (adjustment: number) => {
    if (!props.userId || !adjustmentReason.trim()) {
      return toast.error('Please provide a reason for the adjustment')
    }

    if (Math.abs(adjustment) > 1000) {
      return toast.error('Adjustment value must be between -1000 and 1000')
    }

    setIsAdjusting(true)
    adjustTrustScoreMutation.mutate({
      userId: props.userId,
      adjustment,
      reason: adjustmentReason.trim(),
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
      {userQuery.isPending && (
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
                    variant={getRoleVariant(userQuery.data.role ?? 'USER')}
                    className="text-xs"
                  >
                    {userQuery.data.role}
                  </Badge>
                  <span className="text-white/80 text-sm">
                    Member since{' '}
                    {formatDate(userQuery.data.createdAt ?? new Date())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <GamepadIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Listings
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {userQuery.data.listings.items.length}
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
                  {userQuery.data.votes.items.length}
                </p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Trust Score
                  </span>
                </div>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {userQuery.data.trustScore}
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  {TRUST_LEVELS.find(
                    (level) =>
                      userQuery.data?.trustScore &&
                      userQuery.data.trustScore >= level.minScore,
                  )?.name || 'Unranked'}
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Account Age
                  </span>
                </div>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {formatTimeAgo(userQuery.data.createdAt ?? new Date())}
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-300">
                    Reports
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {reportStatsQuery.data?.totalReports ?? 0}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  {reportStatsQuery.data?.reportedListingsCount ?? 0} listings
                  reported
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
                        <Code
                          label={`${userQuery.data.id?.slice(0, 10) ?? 'N/A'}...`}
                          value={userQuery.data.id}
                        />
                        <button
                          type="button"
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
                        <Badge
                          variant={getRoleVariant(
                            userQuery.data.role ?? 'USER',
                          )}
                        >
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
                      {formatDate(userQuery.data.createdAt ?? new Date())}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(userQuery.data.createdAt ?? new Date())}
                    </p>
                  </div>

                  {/* Ban Status */}
                  <div
                    className={`p-3 rounded-lg ${
                      banStatusQuery.data?.isBanned
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Ban
                          className={`w-4 h-4 ${
                            banStatusQuery.data?.isBanned
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        />
                        Ban Status
                      </span>
                      {banStatusQuery.data?.isBanned && (
                        <Link
                          href="/admin/user-bans"
                          className="text-xs text-red-600 dark:text-red-400 hover:underline"
                        >
                          Manage Bans
                        </Link>
                      )}
                    </div>
                    {banStatusQuery.data?.isBanned ? (
                      <div>
                        <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                          Currently Banned
                        </p>
                        {banStatusQuery.data.ban && (
                          <>
                            <p className="text-xs text-red-700 dark:text-red-300 mb-1">
                              Reason: {banStatusQuery.data.ban.reason}
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300">
                              Banned by:{' '}
                              {banStatusQuery.data.ban.bannedBy?.name ||
                                'Unknown'}
                            </p>
                            {banStatusQuery.data.ban.expiresAt && (
                              <p className="text-xs text-red-700 dark:text-red-300">
                                Expires:{' '}
                                {formatDate(
                                  new Date(banStatusQuery.data.ban.expiresAt),
                                )}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-green-900 dark:text-green-100">
                        Account in good standing
                      </p>
                    )}
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
                        {userQuery.data.listings.items.length} total
                      </span>
                    </div>

                    {userQuery.data.listings.items.length > 0 ? (
                      <div className="space-y-1">
                        {userQuery.data.listings.items
                          .slice(0, 3)
                          .map((listing) => (
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
                        {userQuery.data.listings.items.length > 3 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            +{userQuery.data.listings.items.length - 3} more...
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
                        {userQuery.data.votes.items.length} votes
                      </span>
                    </div>

                    {userQuery.data.votes.items.length > 0 ? (
                      <div className="space-y-1">
                        {userQuery.data.votes.items.slice(0, 3).map((vote) => (
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
                        {userQuery.data.votes.items.length > 3 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            +{userQuery.data.votes.items.length - 3} more
                            votes...
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No votes cast yet
                      </p>
                    )}
                  </div>

                  {/* Trust Activity */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Trust Activity
                      </span>
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full">
                        {userQuery.data.trustActionLogs?.length || 0} actions
                      </span>
                    </div>

                    {userQuery.data.trustActionLogs &&
                    userQuery.data.trustActionLogs.length > 0 ? (
                      <div className="space-y-1">
                        {userQuery.data.trustActionLogs
                          .slice(0, 3)
                          .map((log) => (
                            <div
                              key={log.id}
                              className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between"
                            >
                              <span className="truncate flex items-center gap-1">
                                <Badge
                                  variant={getTrustActionBadgeColor(log.action)}
                                  size="sm"
                                  className="text-xs"
                                >
                                  {log.action}
                                </Badge>
                              </span>
                              <span
                                className={cn(
                                  'ml-2 font-medium',
                                  log.weight > 0
                                    ? 'text-green-600'
                                    : 'text-red-600',
                                )}
                              >
                                {log.weight > 0 ? '+' : ''}
                                {log.weight}
                              </span>
                            </div>
                          ))}
                        {userQuery.data.trustActionLogs.length > 3 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            +{userQuery.data.trustActionLogs.length - 3} more
                            actions...
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No trust actions yet
                      </p>
                    )}
                  </div>

                  {/* Trust Score Adjustment - SUPER_ADMIN Only */}
                  {isSuperAdmin && (
                    <div className="p-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg border border-purple-200/30 dark:border-purple-800/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          Trust Score Adjustment
                        </span>
                        <Badge variant="default" size="sm" className="text-xs">
                          {userQuery.data.role}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {/* Quick adjustment buttons */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium min-w-0 flex-shrink-0">
                            Quick:
                          </span>
                          <div className="flex gap-1">
                            {[-10, -1, 1, 10].map((value) => (
                              <Button
                                key={value}
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleTrustScoreAdjustment(value)
                                }
                                disabled={
                                  isAdjusting || !adjustmentReason.trim()
                                }
                                className={cn(
                                  'h-8 px-2 text-xs min-w-[44px] transition-all duration-200',
                                  value > 0
                                    ? 'border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20'
                                    : 'border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20',
                                )}
                              >
                                {value > 0 ? (
                                  <Plus className="w-3 h-3 mr-1" />
                                ) : (
                                  <Minus className="w-3 h-3 mr-1" />
                                )}
                                {Math.abs(value)}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Custom adjustment */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium min-w-0 flex-shrink-0">
                            Custom:
                          </span>
                          <Input
                            type="number"
                            placeholder="±points"
                            value={customAdjustment}
                            onChange={(e) =>
                              setCustomAdjustment(e.target.value)
                            }
                            disabled={isAdjusting}
                            className="h-8 text-xs w-20"
                            min="-1000"
                            max="1000"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const adjustment = parseInt(customAdjustment)
                              if (!isNaN(adjustment) && adjustment !== 0) {
                                handleTrustScoreAdjustment(adjustment)
                              } else {
                                toast.error(
                                  'Please enter a valid non-zero number',
                                )
                              }
                            }}
                            disabled={
                              isAdjusting ||
                              !customAdjustment.trim() ||
                              !adjustmentReason.trim()
                            }
                            className="h-8 px-3 text-xs"
                          >
                            Apply
                          </Button>
                        </div>

                        {/* Reason input */}
                        <div>
                          <Input
                            placeholder="Reason for adjustment (required)"
                            value={adjustmentReason}
                            onChange={(e) =>
                              setAdjustmentReason(e.target.value)
                            }
                            disabled={isAdjusting}
                            className="h-8 text-xs"
                            maxLength={500}
                          />
                        </div>

                        {isAdjusting && (
                          <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                            <LoadingSpinner />
                            <span>Applying adjustment...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
