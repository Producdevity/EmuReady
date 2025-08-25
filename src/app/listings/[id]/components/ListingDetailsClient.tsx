'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isNullish, isNumber } from 'remeda'
import { DRIVER_VERSION_FIELD_NAME } from '@/app/listings/components/shared/CustomFieldRenderer'
import {
  Card,
  Badge,
  PerformanceBadge,
  Button,
  TranslatableMarkdown,
  VerifiedDeveloperBadge,
  ListingVerificationBadge,
  ApprovalStatusBadge,
  LocalizedDate,
} from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { roleIncludesRole } from '@/utils/permission-system'
import { CustomFieldType, Role } from '@orm'
import CommentThread from './CommentThread'
import EditListingButton from './EditListingButton'
import ReportListingButton from './ReportListingButton'
import VerifyListingButton from './VerifyListingButton'
import ViewConfigButton from './ViewConfigButton'
import VoteReminderBanner from './vote-reminder/VoteReminderBanner'
import VoteButtons from './VoteButtons'

export type Listing = NonNullable<RouterOutput['listings']['byId']>

interface Props {
  listing: Listing
  successRate: number
  upVotes: number
  totalVotes: number
  userVote: boolean | null
}

function ListingDetailsClient(props: Props) {
  const listingId = props.listing.id
  const utils = api.useUtils()
  const router = useRouter()

  // Get current user to check if they can see banned user indicators
  const currentUserQuery = api.users.me.useQuery()
  const canViewBannedUsers = roleIncludesRole(currentUserQuery.data?.role, Role.MODERATOR)

  const refreshData = () => {
    utils.listings.byId.invalidate({ id: listingId }).catch(console.error)
  }

  const scrollToVoteSection = () => {
    const voteSection = document.getElementById('vote-section')
    if (!voteSection) return
    voteSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const voteMutation = api.listings.vote.useMutation({
    onSuccess: () => {
      refreshData()
    },
    onError: (error) => {
      toast.error(`Failed to vote: ${getErrorMessage(error)}`)
    },
  })

  const handleVote = async (value: boolean | null) => {
    try {
      if (value !== null) {
        // Normal vote - send the value directly, API handles toggle logic
        await voteMutation.mutateAsync({
          listingId: props.listing.id,
          value: value,
        })
      } else if (props.userVote !== null) {
        // For vote removal, we need to know what the current vote is and send that same value
        // The API handles toggle logic - if same value is sent, it removes the vote
        await voteMutation.mutateAsync({
          listingId: props.listing.id,
          value: props.userVote, // Send current vote value to toggle it off
        })
      }

      utils.listings.byId.invalidate({ id: listingId }).catch(console.error)
    } catch (error) {
      console.error('Error voting:', error)
      // The mutation's onError will handle user-facing error messages
    }
  }

  const renderCustomFieldValue = (
    fieldValue: NonNullable<Props['listing']['customFieldValues']>[0],
  ) => {
    switch (fieldValue.customFieldDefinition.type) {
      case CustomFieldType.BOOLEAN:
        return (
          <Badge variant={fieldValue.value ? 'success' : 'default'}>
            {fieldValue.value ? 'Yes' : 'No'}
          </Badge>
        )
      case CustomFieldType.SELECT:
        // For select fields, try to find the label from options
        if (Array.isArray(fieldValue.customFieldDefinition.options)) {
          const option = (
            fieldValue.customFieldDefinition.options as {
              value: string
              label: string
            }[]
          ).find((opt) => opt.value === String(fieldValue.value))
          return option?.label ?? String(fieldValue.value)
        }
        return String(fieldValue.value)
      case CustomFieldType.RANGE:
        // For range fields, format the number with unit and proper decimals
        if (isNumber(fieldValue.value)) {
          const decimals = fieldValue.customFieldDefinition.rangeDecimals ?? 0
          const unit = fieldValue.customFieldDefinition.rangeUnit ?? ''
          const formatted =
            decimals > 0
              ? fieldValue.value.toFixed(decimals)
              : Math.round(fieldValue.value).toString()
          return (
            <Badge>
              {formatted}
              {unit}
            </Badge>
          )
        }
        return String(fieldValue.value ?? '')
      case CustomFieldType.URL:
        if (typeof fieldValue.value === 'string' && fieldValue.value.trim()) {
          return (
            <a
              href={fieldValue.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {fieldValue.value}
            </a>
          )
        }
        return String(fieldValue.value)
      case CustomFieldType.TEXT:
        // Special handling for driver version field
        if (fieldValue.customFieldDefinition.name === DRIVER_VERSION_FIELD_NAME) {
          const valueStr = String(fieldValue.value ?? '')

          // Check for separator format: "display|||filename"
          if (valueStr.includes('|||')) {
            const [displayPart] = valueStr.split('|||')
            return <span className="break-words overflow-wrap-anywhere">{displayPart}</span>
          }

          // Try to parse as JSON for backward compatibility
          try {
            const parsed = JSON.parse(valueStr)
            if (parsed && typeof parsed === 'object') {
              // It's JSON - show display value or fallback to a safe message
              return (
                <span className="break-words overflow-wrap-anywhere">
                  {parsed.display || parsed.release || 'Custom Driver'}
                </span>
              )
            }
          } catch {
            // Not JSON, show as-is (legacy format)
          }

          // Legacy format or simple string - show as-is
          return <span className="break-words overflow-wrap-anywhere">{valueStr}</span>
        }
        return (
          <span className="break-words overflow-wrap-anywhere">
            {String(fieldValue.value ?? '')}
          </span>
        )
      case CustomFieldType.TEXTAREA:
      default:
        return (
          <span className="break-words overflow-wrap-anywhere">
            {String(fieldValue.value ?? '')}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 py-4 lg:py-10 px-4 flex justify-center items-start">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-4xl"
      >
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Card className="p-4 lg:p-8 shadow-2xl rounded-2xl lg:rounded-3xl border-0 bg-white dark:bg-gray-900">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
            {/* Game Info */}
            <div className="flex-1 md:pr-8 sm:border-r-0 md:border-r md:border-gray-200 md:dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-indigo-700 dark:text-indigo-300">
                  {props.listing?.game.title}
                </h1>

                <Link
                  href={`/games/${props.listing?.game.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md self-start sm:self-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Game
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">System: {props.listing?.game.system?.name}</Badge>
                <Badge
                  onClick={() => router.push(`/devices?deviceId=${props.listing?.device?.id}`)}
                  variant="default"
                  className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Device: {props.listing?.device?.brand?.name} {props.listing?.device?.modelName}
                </Badge>
                <Badge
                  onClick={() =>
                    router.push(`/emulators?emulatorId=${props.listing?.emulator?.id}`)
                  }
                  variant="default"
                  className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Emulator: {props.listing?.emulator?.name}
                </Badge>
                <PerformanceBadge
                  pill={false}
                  rank={props.listing.performance.rank}
                  label={props.listing.performance.label}
                  description={props.listing.performance?.description}
                />
                {props.listing.isVerifiedDeveloper && (
                  <div className="ml-1">
                    <VerifiedDeveloperBadge showText />
                  </div>
                )}
                {props.listing.developerVerifications &&
                  props.listing.developerVerifications.length > 0 && (
                    <ListingVerificationBadge
                      verifications={props.listing.developerVerifications}
                      showText
                      showTooltip={true}
                    />
                  )}
                {canViewBannedUsers && <ApprovalStatusBadge status={props.listing.status} />}
              </div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Notes
                </h2>
                {props.listing?.notes ? (
                  <TranslatableMarkdown
                    content={props.listing.notes}
                    className="text-gray-600 dark:text-gray-300 text-base leading-relaxed break-words overflow-wrap-anywhere"
                    preserveWhitespace={true}
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                    No notes provided.
                  </p>
                )}
              </div>

              {/* Custom Fields Section */}
              {props.listing?.customFieldValues && props.listing.customFieldValues.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    Emulator-Specific Details
                  </h2>
                  <div className="space-y-3">
                    {props.listing.customFieldValues
                      .filter(
                        (fieldValue) => !isNullish(fieldValue.value) && fieldValue.value !== '',
                      )
                      .map((fieldValue) => (
                        <div
                          key={fieldValue.id}
                          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300 sm:min-w-[120px] sm:flex-shrink-0">
                              {fieldValue.customFieldDefinition.label}:
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 break-words overflow-wrap-anywhere min-w-0 flex-1">
                              {renderCustomFieldValue(fieldValue)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <div id="vote-section" className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Success Rate
                </h2>
                <VoteButtons
                  listingId={props.listing?.id}
                  currentVote={props.userVote}
                  upVoteCount={props.upVotes}
                  totalVotes={props.totalVotes}
                  onVoteSuccess={refreshData}
                  gameId={props.listing?.game.id}
                  systemId={props.listing?.game.system?.id}
                  emulatorId={props.listing?.emulator?.id}
                  deviceId={props.listing?.device?.id}
                />
              </div>
            </div>
            {/* Author Info */}
            <div className="flex flex-col items-center gap-2 w-full md:w-auto md:min-w-[140px]">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-indigo-200 dark:bg-indigo-800">
                {props.listing?.author?.profileImage ? (
                  <Image
                    src={props.listing?.author.profileImage}
                    alt={`${props.listing?.author?.name ?? 'Author'}'s profile`}
                    fill
                    sizes="64px"
                    className="object-cover"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                    {props.listing?.author?.name?.[0] ?? '?'}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {props.listing?.author?.name ?? 'Unknown'}
                </div>
                {canViewBannedUsers &&
                  props.listing?.author &&
                  'userBans' in props.listing.author &&
                  Array.isArray(props.listing.author.userBans) &&
                  props.listing.author.userBans.length > 0 && (
                    <Badge variant="danger" size="sm" className="mt-1">
                      BANNED USER
                    </Badge>
                  )}
              </div>
              <Link
                href={`/users/${props.listing?.author?.id ?? ''}`}
                className="mt-2 text-indigo-600 hover:underline text-xs"
              >
                View Profile
              </Link>

              {/* Posted Date */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Posted</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LocalizedDate date={props.listing.createdAt} format="timeAgo" />
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    <LocalizedDate date={props.listing.createdAt} format="dateTime" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-2 flex flex-col gap-2">
                <EditListingButton listingId={props.listing.id} onSuccess={refreshData} />
                <ReportListingButton
                  listingId={props.listing.id}
                  authorId={props.listing.authorId}
                  onSuccess={refreshData}
                />
                <VerifyListingButton
                  listingId={props.listing.id}
                  emulatorId={props.listing.emulatorId}
                  authorId={props.listing.authorId}
                  isAlreadyVerified={
                    props.listing.developerVerifications?.some(
                      (verification) => verification.developer.id === currentUserQuery.data?.id,
                    ) ?? false
                  }
                  verificationId={
                    props.listing.developerVerifications?.find(
                      (verification) => verification.developer.id === currentUserQuery.data?.id,
                    )?.id
                  }
                  onSuccess={refreshData}
                />
                <ViewConfigButton
                  listingId={props.listing.id}
                  emulatorId={props.listing.emulatorId}
                />
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
            <CommentThread
              listingId={props.listing?.id}
              initialSortBy="newest"
              gameId={props.listing?.game.id}
              systemId={props.listing?.game.system?.id}
              listingOwnerId={props.listing?.authorId}
            />
          </div>
        </Card>
      </motion.div>

      {/* Vote Reminder Banner */}
      <VoteReminderBanner
        listingId={props.listing.id}
        onVoteClick={scrollToVoteSection}
        currentVote={props.userVote}
        onVote={handleVote}
      />
    </div>
  )
}

export default ListingDetailsClient
