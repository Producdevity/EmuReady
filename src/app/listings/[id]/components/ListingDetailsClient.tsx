'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { CustomFieldsSection } from '@/app/listings/components/shared/CustomFieldsSection'
import { ActionButtonsStack } from '@/app/listings/components/shared/details/ActionButtonsStack'
import { AuthorPanel } from '@/app/listings/components/shared/details/AuthorPanel'
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
import { Role } from '@orm'
import CommentThread from './CommentThread'
import EditListingButton from './EditListingButton'
import ReportListingButton from './ReportListingButton'
import VerifyListingButton from './VerifyListingButton'
import ViewConfigButton from './ViewConfigButton'
import { VoteReminderBanner } from './vote-reminder/VoteReminderBanner'
import { VoteButtons } from './VoteButtons'

export type Listing = NonNullable<RouterOutput['listings']['byId']>

interface Props {
  listing: Listing
}

function ListingDetailsClient(props: Props) {
  const utils = api.useUtils()
  const router = useRouter()
  const voteSectionRef = useRef<HTMLDivElement>(null)

  // Get current user to check if they can see banned user indicators
  const currentUserQuery = api.users.me.useQuery()
  const canViewBannedUsers = roleIncludesRole(currentUserQuery.data?.role, Role.MODERATOR)

  const refreshData = async () => {
    await utils.listings.byId.invalidate({ id: props.listing.id })
    await utils.listings.byId.refetch({ id: props.listing.id })
  }

  const scrollToVoteSection = () => {
    voteSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const voteMutation = api.listings.vote.useMutation({
    onSuccess: refreshData,
    onError: (error) => {
      logger.error('[ListingDetailsClient] handleVoting:', error)
      toast.error(`Failed to vote: ${getErrorMessage(error)}`)
    },
  })

  const handleVote = async (value: boolean | null) => {
    if (value !== null) {
      // Normal vote - send the value directly, API handles toggle logic
      await voteMutation.mutateAsync({ listingId: props.listing.id, value })
    } else if (props.listing.userVote !== null) {
      // For vote removal, we need to know what the current vote is and send that same value
      // The API handles toggle logic - if same value is sent, it removes the vote
      await voteMutation.mutateAsync({
        listingId: props.listing.id,
        value: props.listing.userVote, // Send current vote value to toggle it off
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 py-4 lg:py-10 px-4 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mx-auto w-full max-w-5xl"
      >
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Card className="w-full p-4 lg:p-8 shadow-2xl rounded-2xl lg:rounded-3xl border-0 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex w-full flex-col items-start gap-6 lg:gap-8 md:flex-row">
            {/* Game Info */}
            <div className="flex-1 md:pr-8 sm:border-r-0 md:border-r md:border-gray-200 md:dark:border-gray-700">
              {/* Game Image */}
              <div className="mb-6">
                <GameImage
                  game={props.listing.game}
                  className="w-full aspect-video rounded-lg shadow-md"
                  aspectRatio="video"
                  showFallback={true}
                  priority={true}
                />
              </div>

              <DetailsHeader
                title={props.listing.game.title}
                gameUrl={`/games/${props.listing.game.id}`}
                badges={[
                  <DetailsHeaderBadges
                    key="shared-badges"
                    universalListing={props.listing}
                    canViewBannedUsers={canViewBannedUsers}
                  />,
                ]}
              />

              <NotesSection content={props.listing?.notes ?? ''} />
              <CustomFieldsSection
                title="Emulator-Specific Details"
                fieldValues={props.listing?.customFieldValues ?? []}
              />
            </div>
            <div className="flex w-full flex-col items-center gap-4 md:w-auto md:min-w-[180px] md:items-start">
              <AuthorPanel
                profileImage={props.listing?.author?.profileImage}
                authorName={props.listing?.author?.name}
                authorId={props.listing?.author?.id}
                postedAt={props.listing.createdAt}
                bannedBadge={
                  canViewBannedUsers &&
                  props.listing?.author &&
                  'userBans' in props.listing.author &&
                  Array.isArray(props.listing.author.userBans) &&
                  props.listing.author.userBans.length > 0 ? (
                    <Badge variant="danger" size="sm" className="mt-1">
                      BANNED USER
                    </Badge>
                  ) : undefined
                }
              />
              <ActionButtonsStack>
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
              </ActionButtonsStack>
            </div>
          </div>

          <VotingSection id="vote-section" ref={voteSectionRef}>
            <VoteButtons
              listingId={props.listing.id}
              currentVote={props.listing.userVote ?? null}
              upVoteCount={props.listing.upVotes}
              totalVotes={props.listing.totalVotes}
              onVoteSuccess={refreshData}
              gameId={props.listing.game.id}
              systemId={props.listing.game.system?.id}
              emulatorId={props.listing.emulator.id}
              deviceId={props.listing.device?.id}
            />
          </VotingSection>

          <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
            <CommentThread
              listingId={props.listing?.id}
              gameId={props.listing?.game.id}
              systemId={props.listing?.game.system?.id}
              listingOwnerId={props.listing?.authorId}
              emulatorId={props.listing?.emulatorId}
            />
          </div>
        </Card>
      </motion.div>

      {/* Vote Reminder Banner */}
      <VoteReminderBanner
        listingId={props.listing.id}
        onVoteClick={scrollToVoteSection}
        currentVote={props.listing.userVote ?? null}
        onVote={handleVote}
      />
    </div>
  )
}

export default ListingDetailsClient
