'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import analytics from '@/lib/analytics'
import toast from '@/lib/toast'
import { getBarColor, getBarWidth } from '@/utils/vote'
import { wilsonPercent } from '@/utils/wilson-score'

interface VoteButtonsProps {
  listingId: string
  currentVote: boolean | null
  upVoteCount: number
  totalVotes: number
  onVote: (value: boolean) => Promise<void>
  onVoteSuccess?: () => void
  isLoading?: boolean
  analyticsContext?: {
    gameId?: string
    systemId?: string
    emulatorId?: string
    deviceId?: string
  }
  VotingHelpModal: ComponentType<{
    isOpen: boolean
    onClose: () => void
  }>
  labels?: {
    title?: string
    confirmButton?: string
    inaccurateButton?: string
    signInMessage?: string
    verifiedByText?: string
  }
}

export function VoteButtons(props: VoteButtonsProps) {
  const { user } = useUser()
  const isAuthenticated = !!user

  const [optimisticVote, setOptimisticVote] = useState<boolean | null>(props.currentVote)
  const [optimisticUpVotes, setOptimisticUpVotes] = useState(props.upVoteCount)
  const [optimisticTotalVotes, setOptimisticTotalVotes] = useState(props.totalVotes)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const labels = {
    title: 'Community Verification',
    confirmButton: 'Confirm',
    inaccurateButton: 'Inaccurate',
    signInMessage: 'Please sign in to verify this listing',
    verifiedByText: 'verified by',
    ...props.labels,
  }

  const handleVote = async (value: boolean) => {
    if (!isAuthenticated) {
      toast.info(labels.signInMessage)
      return
    }

    // Track analytics before updating optimistic state
    const previousVote = optimisticVote
    let finalVoteValue: boolean | null = value

    // If the same vote clicked, we're removing the vote (toggle behavior)
    if (optimisticVote === value) {
      finalVoteValue = null
    }

    if (props.analyticsContext) {
      analytics.engagement.vote({
        listingId: props.listingId,
        voteValue: finalVoteValue,
        previousVote,
        ...props.analyticsContext,
      })
    }

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

    try {
      await props.onVote(value)
      props.onVoteSuccess?.()
    } catch (error) {
      // Revert optimistic updates on error
      setOptimisticVote(props.currentVote)
      setOptimisticUpVotes(props.upVoteCount)
      setOptimisticTotalVotes(props.totalVotes)
      throw error
    }
  }

  const successRate = wilsonPercent(
    optimisticUpVotes,
    Math.max(0, optimisticTotalVotes - optimisticUpVotes),
  )

  const barColor = getBarColor(successRate)
  const barWidth = getBarWidth(successRate, optimisticTotalVotes)

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        {/* Header with title and help */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{labels.title}</h3>
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="How does verification work?"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button
            type="button"
            onClick={() => handleVote(true)}
            disabled={!isAuthenticated || props.isLoading}
            className={`flex flex-col items-center p-3 rounded-lg transition-colors border-2 ${
              optimisticVote === true
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-600'
            }`}
            title={isAuthenticated ? 'Confirm - This matches my experience' : 'Login to verify'}
          >
            <CheckCircle className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{labels.confirmButton}</span>
          </button>

          <div className="text-center px-4">
            <div className="text-3xl font-bold text-gray-700 dark:text-gray-200">
              {successRate}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {labels.verifiedByText} {optimisticTotalVotes} users
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleVote(false)}
            disabled={!isAuthenticated || props.isLoading}
            className={`flex flex-col items-center p-3 rounded-lg transition-colors border-2 ${
              optimisticVote === false
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-600'
            }`}
            title={
              isAuthenticated ? "Inaccurate - This doesn't match my experience" : 'Login to verify'
            }
          >
            <XCircle className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{labels.inaccurateButton}</span>
          </button>
        </div>

        {/* Progress bar showing success rate / verified */}
        <div className="w-full mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {!isAuthenticated && (
          <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            <SignInButton mode="modal">
              <button className="text-blue-500 hover:underline" data-clerk-sign-in-trigger>
                Sign in
              </button>
            </SignInButton>{' '}
            to verify
          </div>
        )}
      </div>

      <props.VotingHelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </>
  )
}
