'use client'

import { VoteButtons as SharedVoteButtons } from '@/components/ui'
import { api } from '@/lib/api'
import { useRecaptchaForVote } from '@/lib/captcha/hooks'
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
  const { executeForVote, isCaptchaEnabled } = useRecaptchaForVote()

  const voteMutation = api.listings.vote.useMutation({
    onSuccess: () => {
      props.onVoteSuccess?.()
    },
  })

  const handleVote = async (value: boolean) => {
    // Get CAPTCHA token if enabled
    let recaptchaToken: string | null = null
    if (isCaptchaEnabled) recaptchaToken = await executeForVote()

    voteMutation.mutate({
      listingId: props.listingId,
      value,
      ...(recaptchaToken && { recaptchaToken }),
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
