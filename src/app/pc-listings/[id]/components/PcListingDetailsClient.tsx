'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink, Monitor, Cpu, HardDrive } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isNullish, isNumber } from 'remeda'
import {
  Card,
  Badge,
  PerformanceBadge,
  Button,
  TranslatableMarkdown,
  ApprovalStatusBadge,
  LocalizedDate,
} from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'
import { roleIncludesRole } from '@/utils/permission-system'
import { CustomFieldType, PcOs, Role } from '@orm'
import EditPcListingButton from './EditPcListingButton'
import PcCommentThread from './PcCommentThread'
import PcReportListingButton from './PcReportListingButton'
import PcVoteButtons from './PcVoteButtons'
import VerifyPcListingButton from './VerifyPcListingButton'

export type PcListing = NonNullable<RouterOutput['pcListings']['byId']> & {
  userVote?: boolean | null
  upvotes?: number
  downvotes?: number
}

interface Props {
  pcListing: PcListing
}

const osLabels: Record<PcOs | 'UNKNOWN', string> = {
  [PcOs.WINDOWS]: 'Windows',
  [PcOs.LINUX]: 'Linux',
  [PcOs.MACOS]: 'macOS',
  UNKNOWN: 'Unknown',
}

function PcListingDetailsClient(props: Props) {
  const router = useRouter()
  const utils = api.useUtils()
  const pcListingId = props.pcListing.id

  // Get current user to check if they can see banned user indicators
  const currentUserQuery = api.users.me.useQuery()
  const canViewBannedUsers = roleIncludesRole(currentUserQuery.data?.role, Role.MODERATOR)

  const refreshData = () => {
    utils.pcListings.byId.invalidate({ id: pcListingId }).catch(console.error)
  }

  const renderCustomFieldValue = (
    fieldValue: NonNullable<Props['pcListing']['customFieldValues']>[0],
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
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {fieldValue.value}
            </a>
          )
        }
        return String(fieldValue.value)
      case CustomFieldType.TEXT:
      case CustomFieldType.TEXTAREA:
      default:
        return String(fieldValue.value ?? '')
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
                  {props.pcListing?.game.title}
                </h1>

                <Link
                  href={`/games/${props.pcListing?.game.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md self-start sm:self-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Game
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">System: {props.pcListing?.game.system?.name}</Badge>
                <Badge
                  onClick={() =>
                    router.push(`/emulators?emulatorId=${props.pcListing?.emulator?.id}`)
                  }
                  variant="default"
                  className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Emulator: {props.pcListing?.emulator?.name}
                </Badge>
                <PerformanceBadge
                  pill={false}
                  rank={props.pcListing.performance.rank}
                  label={props.pcListing.performance.label}
                  description={props.pcListing.performance?.description}
                />
                {canViewBannedUsers && <ApprovalStatusBadge status={props.pcListing.status} />}
              </div>

              {/* PC Hardware Specifications */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  PC Specifications
                </h2>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-5 w-5 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">CPU:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {props.pcListing.cpu.brand.name} {props.pcListing.cpu.modelName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">GPU:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {props.pcListing.gpu
                          ? `${props.pcListing.gpu.brand.name} ${props.pcListing.gpu.modelName}`
                          : 'Integrated Graphics'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Memory:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {props.pcListing.memorySize}GB RAM
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <div className="h-3 w-3 bg-gray-500 rounded" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">OS:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {osLabels[props.pcListing.os] || osLabels.UNKNOWN}{' '}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <div className="h-3 w-3 bg-gray-500 rounded" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        OS Version:
                      </span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {props.pcListing.osVersion}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Notes
                </h2>
                {props.pcListing?.notes ? (
                  <TranslatableMarkdown
                    content={props.pcListing.notes}
                    className="text-gray-600 dark:text-gray-300 text-base leading-relaxed"
                    preserveWhitespace={true}
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                    No notes provided.
                  </p>
                )}
              </div>

              {/* Custom Fields Section */}
              {props.pcListing?.customFieldValues &&
                props.pcListing.customFieldValues.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                      Emulator-Specific Details
                    </h2>
                    <div className="space-y-3">
                      {props.pcListing.customFieldValues
                        .filter(
                          (fieldValue) => !isNullish(fieldValue.value) && fieldValue.value !== '',
                        )
                        .map((fieldValue) => (
                          <div
                            key={fieldValue.id}
                            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                                {fieldValue.customFieldDefinition.label}:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {renderCustomFieldValue(fieldValue)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Author Info */}
            <div className="flex flex-col items-center gap-2 w-full md:w-auto md:min-w-[140px]">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-indigo-200 dark:bg-indigo-800">
                {props.pcListing?.author?.profileImage ? (
                  <Image
                    src={props.pcListing?.author.profileImage}
                    alt={`${props.pcListing?.author?.name ?? 'Author'}'s profile`}
                    fill
                    sizes="64px"
                    className="object-cover"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                    {props.pcListing?.author?.name?.[0] ?? '?'}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {props.pcListing?.author?.name ?? 'Unknown'}
                </div>
                {canViewBannedUsers &&
                  props.pcListing?.author &&
                  'userBans' in props.pcListing.author &&
                  Array.isArray(props.pcListing.author.userBans) &&
                  props.pcListing.author.userBans.length > 0 && (
                    <Badge variant="danger" size="sm" className="mt-1">
                      BANNED USER
                    </Badge>
                  )}
              </div>
              <Link
                href={`/users/${props.pcListing?.author?.id ?? ''}`}
                className="mt-2 text-indigo-600 hover:underline text-xs"
              >
                View Profile
              </Link>

              {/* Posted Date */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Posted</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LocalizedDate date={props.pcListing.createdAt} format="timeAgo" />
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    <LocalizedDate date={props.pcListing.createdAt} format="dateTime" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <EditPcListingButton pcListingId={props.pcListing.id} onSuccess={refreshData} />
                <PcReportListingButton
                  pcListingId={props.pcListing.id}
                  authorId={props.pcListing.authorId}
                  onSuccess={refreshData}
                />
                <VerifyPcListingButton
                  pcListingId={props.pcListing.id}
                  emulatorId={props.pcListing.emulatorId}
                  authorId={props.pcListing.authorId}
                  isAlreadyVerified={
                    props.pcListing.developerVerifications?.some(
                      (v) => v.developer.id === currentUserQuery.data?.id,
                    ) ?? false
                  }
                  verificationId={
                    props.pcListing.developerVerifications?.find(
                      (v) => v.developer.id === currentUserQuery.data?.id,
                    )?.id
                  }
                  onSuccess={refreshData}
                />
              </div>
            </div>
          </div>

          {/* Voting Section */}
          <div
            className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
            id="vote-section"
          >
            <PcVoteButtons
              pcListingId={props.pcListing.id}
              currentVote={props.pcListing.userVote ?? null}
              upVoteCount={props.pcListing.upvotes ?? 0}
              totalVotes={(props.pcListing.upvotes ?? 0) + (props.pcListing.downvotes ?? 0)}
              onVoteSuccess={refreshData}
              gameId={props.pcListing.game.id}
              systemId={props.pcListing.game.system?.id}
              emulatorId={props.pcListing.emulator.id}
              cpuId={props.pcListing.cpu.id}
              gpuId={props.pcListing.gpu?.id}
            />
          </div>

          {/* Comments Section */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <PcCommentThread
              pcListingId={props.pcListing.id}
              gameId={props.pcListing.game.id}
              systemId={props.pcListing.game.system?.id}
              pcListingOwnerId={props.pcListing.authorId}
            />
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default PcListingDetailsClient
