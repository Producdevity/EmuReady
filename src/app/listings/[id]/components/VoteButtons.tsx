'use client'

import { VoteButtons as SharedVoteButtons } from '@/components/ui'
import { useListingApi, type ListingType } from '@/lib/api/useListingApi'
import { useRecaptchaForVote } from '@/lib/captcha/hooks'
import VotingHelpModal from './VotingHelpModal'

interface Props {
  listingId: string
  listingType: ListingType
  currentVote: boolean | null
  upVoteCount: number
  totalVotes: number
  onVoteSuccess?: () => void
  gameId?: string
  systemId?: string
  emulatorId?: string
  deviceId?: string
  signInMessage?: string
}

export function VoteButtons(props: Props) {
  const { executeForVote, isCaptchaEnabled } = useRecaptchaForVote()
  const listingApi = useListingApi(props.listingType)

  const handleVote = async (value: boolean) => {
    const recaptchaToken = isCaptchaEnabled ? await executeForVote() : null

    listingApi.vote(
      {
        listingId: props.listingId,
        value,
        recaptchaToken,
      },
      { onSuccess: () => props.onVoteSuccess?.() },
    )
  }

  return (
    <SharedVoteButtons
      listingId={props.listingId}
      currentVote={props.currentVote}
      upVoteCount={props.upVoteCount}
      totalVotes={props.totalVotes}
      onVote={handleVote}
      onVoteSuccess={props.onVoteSuccess}
      isLoading={listingApi.isVotePending}
      analyticsContext={{
        gameId: props.gameId,
        systemId: props.systemId,
        emulatorId: props.emulatorId,
        deviceId: props.deviceId,
      }}
      VotingHelpModal={VotingHelpModal}
      labels={props.signInMessage ? { signInMessage: props.signInMessage } : undefined}
    />
  )
}
