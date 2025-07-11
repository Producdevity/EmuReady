'use client'

import VotingHelpModal from '@/app/listings/[id]/components/VotingHelpModal'
import { VoteButtons } from '@/components/ui'
import { api } from '@/lib/api'
import { useRecaptchaForVote } from '@/lib/captcha/hooks'
import { type RouterInput } from '@/types/trpc'

interface Props {
  pcListingId: string
  currentVote: boolean | null
  upVoteCount: number
  totalVotes: number
  onVoteSuccess?: () => void
  gameId?: string
  systemId?: string
  emulatorId?: string
  cpuId?: string
  gpuId?: string
}

function PcVoteButtons(props: Props) {
  const { executeForVote, isCaptchaEnabled } = useRecaptchaForVote()

  const voteMutation = api.pcListings.vote.useMutation({
    onSuccess: () => {
      props.onVoteSuccess?.()
    },
  })

  const handleVote = async (value: boolean) => {
    // Get CAPTCHA token if enabled
    let recaptchaToken: string | null = null
    if (isCaptchaEnabled) {
      recaptchaToken = await executeForVote()
    }

    voteMutation.mutate({
      pcListingId: props.pcListingId,
      value,
      ...(recaptchaToken && { recaptchaToken }),
    } satisfies RouterInput['pcListings']['vote'])
  }

  return (
    <VoteButtons
      listingId={props.pcListingId}
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
        deviceId: props.cpuId, // Use CPU ID as device identifier
      }}
      VotingHelpModal={VotingHelpModal}
      labels={{
        signInMessage: 'Please sign in to verify this PC listing',
      }}
    />
  )
}

export default PcVoteButtons
