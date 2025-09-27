'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Monitor, Cpu, HardDrive, Globe2, Hash } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { VoteReminderBanner } from '@/app/listings/[id]/components/vote-reminder/VoteReminderBanner'
import { CustomFieldsSection } from '@/app/listings/components/shared/CustomFieldsSection'
import { ActionButtonsStack } from '@/app/listings/components/shared/details/ActionButtonsStack'
import { AuthorPanel } from '@/app/listings/components/shared/details/AuthorPanel'
import { DetailFieldRow } from '@/app/listings/components/shared/details/DetailFieldRow'
import { DetailsHeader } from '@/app/listings/components/shared/details/DetailsHeader'
import { DetailsHeaderBadges } from '@/app/listings/components/shared/details/DetailsHeaderBadges'
import { VotingSection } from '@/app/listings/components/shared/details/VotingSection'
import { NotesSection } from '@/app/listings/components/shared/NotesSection'
import { Card, Button, GameImage, Badge } from '@/components/ui'
import { api } from '@/lib/api'
import { logger } from '@/lib/logger'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { roleIncludesRole } from '@/utils/permission-system'
import { PcOs, Role } from '@orm'
import EditPcListingButton from './EditPcListingButton'
import PcCommentThread from './PcCommentThread'
import PcReportListingButton from './PcReportListingButton'
import PcVoteButtons from './PcVoteButtons'
import VerifyPcListingButton from './VerifyPcListingButton'

export type PcListing = NonNullable<RouterOutput['pcListings']['byId']>

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
  const voteSectionRef = useRef<HTMLDivElement>(null)

  // Get current user to check if they can see banned user indicators
  const currentUserQuery = api.users.me.useQuery()
  const canViewBannedUsers = roleIncludesRole(currentUserQuery.data?.role, Role.MODERATOR)
  const osLabel = osLabels[props.pcListing.os as PcOs] ?? osLabels.UNKNOWN
  const osVersion = props.pcListing.osVersion?.trim() ? props.pcListing.osVersion : '—'

  const hardwareFields = [
    {
      id: 'cpu',
      icon: <Cpu className="h-5 w-5" aria-hidden="true" />,
      label: 'CPU',
      value: `${props.pcListing.cpu.brand.name} ${props.pcListing.cpu.modelName}`,
    },
    {
      id: 'gpu',
      icon: <Monitor className="h-5 w-5" aria-hidden="true" />,
      label: 'GPU',
      value: props.pcListing.gpu
        ? `${props.pcListing.gpu.brand.name} ${props.pcListing.gpu.modelName}`
        : 'Integrated Graphics',
    },
    {
      id: 'memory',
      icon: <HardDrive className="h-5 w-5" aria-hidden="true" />,
      label: 'Memory',
      value: `${props.pcListing.memorySize}GB RAM`,
    },
    {
      id: 'os',
      icon: <Globe2 className="h-5 w-5" aria-hidden="true" />,
      label: 'OS',
      value: osLabel,
    },
    {
      id: 'os-version',
      icon: <Hash className="h-5 w-5" aria-hidden="true" />,
      label: 'OS Version',
      value: osVersion,
    },
  ] as const

  const refreshData = async () => {
    await utils.pcListings.byId.invalidate({ id: props.pcListing.id })
  }

  const scrollToVoteSection = () => {
    voteSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const voteMutation = api.pcListings.vote.useMutation({
    onSuccess: refreshData,
    onError: (error) => {
      logger.error('[PcListingDetailsClient] handleVoting:', error)
      toast.error(`Failed to vote: ${getErrorMessage(error)}`)
    },
  })

  const handleVote = async (value: boolean | null) => {
    if (value !== null) {
      // Normal vote - send the value directly, API handles toggle logic
      await voteMutation.mutateAsync({ pcListingId: props.pcListing.id, value })
    } else if (props.pcListing.userVote !== null) {
      // For vote removal, we need to know what the current vote is and send that same value
      // The API handles toggle logic - if same value is sent, it removes the vote
      await voteMutation.mutateAsync({
        pcListingId: props.pcListing.id,
        value: props.pcListing.userVote, // Send current vote value to toggle it off
      })
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
              {/* Game Image */}
              <div className="mb-6">
                <GameImage
                  game={props.pcListing.game}
                  className="w-full h-48 sm:h-56 md:h-64 rounded-lg shadow-md"
                  aspectRatio="video"
                  showFallback={true}
                  priority={true}
                />
              </div>

              <DetailsHeader
                title={props.pcListing.game.title}
                gameUrl={`/games/${props.pcListing.game.id}`}
                badges={[
                  <DetailsHeaderBadges
                    key="shared-badges"
                    universalListing={props.pcListing}
                    canViewBannedUsers={canViewBannedUsers}
                  />,
                ]}
              />

              {/* PC Hardware Specifications */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  PC Specifications
                </h2>
                <div className="max-w-full rounded-2xl border border-gray-200/70 bg-white/80 p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-800/80">
                  <dl className="space-y-4">
                    {hardwareFields.map((field) => (
                      <DetailFieldRow
                        key={field.id}
                        icon={field.icon}
                        label={field.label}
                        value={<span className="block break-words text-pretty">{field.value}</span>}
                        align="center"
                      />
                    ))}
                  </dl>
                </div>
              </div>

              <NotesSection content={props.pcListing?.notes ?? ''} />

              <CustomFieldsSection
                title="Emulator-Specific Details"
                fieldValues={props.pcListing?.customFieldValues ?? []}
                alignItems="center"
              />
            </div>

            <div className="flex flex-col items-center gap-2 w-full md:w-auto md:min-w-[140px]">
              {(() => {
                const author = props.pcListing.author as typeof props.pcListing.author & {
                  userBans?: unknown
                }
                const userBans = Array.isArray(author?.userBans) ? author.userBans : null

                return (
                  <AuthorPanel
                    profileImage={props.pcListing.author?.profileImage}
                    authorName={props.pcListing.author?.name}
                    authorId={props.pcListing.author?.id}
                    postedAt={props.pcListing.createdAt}
                    bannedBadge={
                      canViewBannedUsers && userBans && userBans.length > 0 ? (
                        <Badge variant="danger" size="sm" className="mt-1">
                          BANNED USER
                        </Badge>
                      ) : undefined
                    }
                  />
                )
              })()}

              <ActionButtonsStack>
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
                      (v: NonNullable<typeof props.pcListing.developerVerifications>[0]) =>
                        v.developer.id === currentUserQuery.data?.id,
                    ) ?? false
                  }
                  verificationId={
                    props.pcListing.developerVerifications?.find(
                      (v: NonNullable<typeof props.pcListing.developerVerifications>[0]) =>
                        v.developer.id === currentUserQuery.data?.id,
                    )?.id
                  }
                  onSuccess={refreshData}
                />
              </ActionButtonsStack>
            </div>
          </div>

          {/* Voting Section */}
          <VotingSection id="vote-section" ref={voteSectionRef}>
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
          </VotingSection>

          {/* Comments Section */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <PcCommentThread
              pcListingId={props.pcListing.id}
              gameId={props.pcListing.game.id}
              systemId={props.pcListing.game.system?.id}
              pcListingOwnerId={props.pcListing.authorId}
              emulatorId={props.pcListing.emulator.id}
            />
          </div>
        </Card>
      </motion.div>

      {/* Vote Reminder Banner */}
      <VoteReminderBanner
        listingId={props.pcListing.id}
        onVoteClick={scrollToVoteSection}
        currentVote={props.pcListing.userVote ?? null}
        onVote={handleVote}
      />
    </div>
  )
}

export default PcListingDetailsClient
