'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { useRecaptchaForVote } from '@/lib/captcha/hooks'
import toast from '@/lib/toast'
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

function VoteButtons(props: Props) {
  const { user } = useUser()
  const isAuthenticated = !!user
  const { executeForVote, isCaptchaEnabled } = useRecaptchaForVote()

  const [optimisticVote, setOptimisticVote] = useState<boolean | null>(
    props.currentVote,
  )
  const [optimisticUpVotes, setOptimisticUpVotes] = useState(props.upVoteCount)
  const [optimisticTotalVotes, setOptimisticTotalVotes] = useState(
    props.totalVotes,
  )
  const [showHelpModal, setShowHelpModal] = useState(false)

  const voteMutation = api.listings.vote.useMutation({
    onSuccess: () => {
      props.onVoteSuccess?.()
    },
  })

  const handleVote = async (value: boolean) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to verify this listing')
      return
    }

    // Get CAPTCHA token if enabled
    let recaptchaToken: string | null = null
    if (isCaptchaEnabled) {
      recaptchaToken = await executeForVote()
    }

    // Track analytics before updating optimistic state
    const previousVote = optimisticVote
    let finalVoteValue: boolean | null = value

    // If the same vote clicked, we're removing the vote (toggle behavior)
    if (optimisticVote === value) {
      finalVoteValue = null
    }

    analytics.engagement.vote({
      listingId: props.listingId,
      voteValue: finalVoteValue,
      previousVote,
      gameId: props.gameId,
      systemId: props.systemId,
      emulatorId: props.emulatorId,
      deviceId: props.deviceId,
    })

    // Apply optimistic update
    let newTotalVotes = optimisticTotalVotes
    let newUpVotes = optimisticUpVotes

    // Handling previous vote state
    if (optimisticVote !== null) {
      // If the same vote clicked, we're removing the vote (toggle behavior)
      if (optimisticVote === value) {
        // If upvote is being removed
        if (value) {
          newUpVotes -= 1
        }
        newTotalVotes -= 1
        setOptimisticVote(null)
      } else {
        newUpVotes = optimisticVote ? newUpVotes - 1 : newUpVotes + 1
        setOptimisticVote(value)
      }
    } else {
      // No previous vote, adding a new vote
      if (value) {
        newUpVotes += 1
      }
      newTotalVotes += 1
      setOptimisticVote(value)
    }

    setOptimisticUpVotes(newUpVotes)
    setOptimisticTotalVotes(newTotalVotes)

    voteMutation.mutate({
      listingId: props.listingId,
      value,
      ...(recaptchaToken && { recaptchaToken }),
    } satisfies RouterInput['listings']['vote'])
  }

  const successRate =
    optimisticTotalVotes > 0
      ? Math.round((optimisticUpVotes / optimisticTotalVotes) * 100)
      : 0

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        {/* Header with title and help */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Community Verification
          </h3>
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="How does verification work?"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleVote(true)}
            disabled={!isAuthenticated || voteMutation.isPending}
            className={`flex flex-col items-center p-3 rounded-lg transition-colors border-2 ${
              optimisticVote === true
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-600'
            }`}
            title={
              isAuthenticated
                ? 'Confirm - This matches my experience'
                : 'Login to verify'
            }
          >
            <CheckCircle className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Confirm</span>
          </button>

          <div className="text-center px-4">
            <div className="text-3xl font-bold text-gray-700 dark:text-gray-200">
              {successRate}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              verified by {optimisticTotalVotes} users
            </div>
          </div>

          <button
            onClick={() => handleVote(false)}
            disabled={!isAuthenticated || voteMutation.isPending}
            className={`flex flex-col items-center p-3 rounded-lg transition-colors border-2 ${
              optimisticVote === false
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-600'
            }`}
            title={
              isAuthenticated
                ? "Inaccurate - This doesn't match my experience"
                : 'Login to verify'
            }
          >
            <XCircle className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Inaccurate</span>
          </button>
        </div>

        {/* Progress bar showing success rate / verified */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${successRate}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {!isAuthenticated && (
          <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            <SignInButton mode="modal">
              <button
                className="text-blue-500 hover:underline"
                data-clerk-sign-in-trigger
              >
                Sign in
              </button>
            </SignInButton>{' '}
            to verify
          </div>
        )}
      </div>

      <VotingHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </>
  )
}

export default VoteButtons
