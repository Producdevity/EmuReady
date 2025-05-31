'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { type RouterInput } from '@/types/trpc'

interface Props {
  listingId: string
  currentVote: boolean | null
  upVoteCount: number
  totalVotes: number
  onVoteSuccess?: () => void
}

function VoteButtons(props: Props) {
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'

  const [optimisticVote, setOptimisticVote] = useState<boolean | null>(
    props.currentVote,
  )
  const [optimisticUpVotes, setOptimisticUpVotes] = useState(props.upVoteCount)
  const [optimisticTotalVotes, setOptimisticTotalVotes] = useState(
    props.totalVotes,
  )

  const voteMutation = api.listings.vote.useMutation({
    onSuccess: () => {
      props.onVoteSuccess?.()
    },
  })

  const handleVote = (value: boolean) => {
    if (!isAuthenticated) {
      // TODO: Redirect to login or show a login prompt
      return
    }

    // Apply optimistic update
    let newTotalVotes = optimisticTotalVotes
    let newUpVotes = optimisticUpVotes

    // Handling previous vote state
    if (optimisticVote !== null) {
      // If same vote clicked, we're removing the vote (toggle behavior)
      if (optimisticVote === value) {
        // If upvote is being removed
        if (value === true) {
          newUpVotes -= 1
        }
        newTotalVotes -= 1
        setOptimisticVote(null)
      } else {
        // Changing vote from up to down or vice versa
        if (optimisticVote === true) {
          // Changing from up to down
          newUpVotes -= 1
        } else {
          // Changing from down to up
          newUpVotes += 1
        }
        setOptimisticVote(value)
      }
    } else {
      // No previous vote, adding a new vote
      if (value === true) {
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
    } satisfies RouterInput['listings']['vote'])
  }

  const successRate =
    optimisticTotalVotes > 0
      ? Math.round((optimisticUpVotes / optimisticTotalVotes) * 100)
      : 0

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleVote(true)}
          disabled={!isAuthenticated || voteMutation.isPending}
          className={`flex flex-col items-center p-2 rounded-full transition-colors ${
            optimisticVote === true
              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
          title={isAuthenticated ? 'Vote Up' : 'Login to vote'}
        >
          <HandThumbUpIcon className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">
            {successRate}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {optimisticTotalVotes} votes
          </div>
        </div>

        <button
          onClick={() => handleVote(false)}
          disabled={!isAuthenticated || voteMutation.isPending}
          className={`flex flex-col items-center p-2 rounded-full transition-colors ${
            optimisticVote === false
              ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
          title={isAuthenticated ? 'Vote Down' : 'Login to vote'}
        >
          <HandThumbDownIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Progress bar showing success rate */}
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
          <Link href="/login" className="text-blue-500 hover:underline">
            Sign in
          </Link>{' '}
          to vote
        </div>
      )}
    </div>
  )
}

export default VoteButtons
