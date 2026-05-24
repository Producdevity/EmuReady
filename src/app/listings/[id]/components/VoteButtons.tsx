'use client'

import { VoteButtons as SharedVoteButtons } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterInput } from '@/types/trpc'
import VotingHelpModal from './VotingHelpModal'

interface Props {
  listingId: string
  currentVote: boolean | null
  upVoteCount: number
  totalVotes: number
  onVoteSuccess?: () => void
  gameId?: string
  systemId?: string
  emulatorId?: string
  deviceId?: string
}

export function VoteButtons(props: Props) {
  const voteMutation = api.listings.vote.useMutation({
    onSuccess: () => {
      props.onVoteSuccess?.()
    },
  })

  const handleVote = async (value: boolean) => {
    voteMutation.mutate({
      listingId: props.listingId,
      value,
    } satisfies RouterInput['listings']['vote'])
  }

  return (
    <SharedVoteButtons
      listingId={props.listingId}
      currentVote={props.currentVote}
      upVoteCount={props.upVoteCount}
      totalVotes={props.totalVotes}
      onVote={handleVote}
      onVoteSuccess={props.onVoteSuccess}
      isLoading={voteMutation.isPending}
      analyticsContext={{
        gameId: props.gameId,
        systemId: props.systemId,
        emulatorId: props.emulatorId,
        deviceId: props.deviceId,
      }}
      VotingHelpModal={VotingHelpModal}
    />
  )
}
