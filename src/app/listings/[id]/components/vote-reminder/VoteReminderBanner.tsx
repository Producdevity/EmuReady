'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, HelpCircle } from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'
import storageKeys from '@/data/storageKeys'
import { useLocalStorage } from '@/hooks'
import analytics from '@/lib/analytics'
import VotingHelpModal from '../VotingHelpModal'
import voteReminderMessages from './voteReminderMessages'

interface Props {
  listingId: string
  onVoteClick: () => void
  currentVote: boolean | null
  onVote: (value: boolean | null) => void
}

// Reduced time for easier testing - change to 60 in production
const TIME_ON_PAGE_SECONDS = 60

function VoteReminderBanner(props: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenDismissed, setHasBeenDismissed] = useLocalStorage(
    storageKeys.popups.voteReminderDismissed,
    false,
  )
  const [showHelpModal, setShowHelpModal] = useState(false)

  // Track the time when component mounts
  const startTimeRef = useRef<number>(Date.now())

  // Function to get actual time spent on page in seconds
  const getTimeOnPage = (): number => {
    return Math.round((Date.now() - startTimeRef.current) / 1000)
  }

  // Randomly select a message when the component mounts
  const selectedMessage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * voteReminderMessages.length)
    return voteReminderMessages[randomIndex]
  }, [])

  useEffect(() => {
    // Don't show if user has already voted or dismissed
    if (hasBeenDismissed || props.currentVote !== null) return

    const timer = setTimeout(() => {
      setIsVisible(true)
      analytics.engagement.voteReminderShown({
        listingId: props.listingId,
        timeOnPage: getTimeOnPage(),
      })
    }, TIME_ON_PAGE_SECONDS * 1000)

    return () => clearTimeout(timer)
  }, [hasBeenDismissed, props.listingId, props.currentVote])

  const handleDismiss = () => {
    analytics.engagement.voteReminderDismissed({
      listingId: props.listingId,
      timeOnPage: getTimeOnPage(),
    })

    setIsVisible(false)
    setHasBeenDismissed(true)
  }

  const handleVote = (voteValue: boolean | null) => {
    analytics.engagement.voteReminderClicked({
      listingId: props.listingId,
      timeOnPage: getTimeOnPage(),
    })

    props.onVote(voteValue)
    setIsVisible(false)
  }

  // Don't render if user already voted, dismissed, or no message
  if (
    !isVisible ||
    hasBeenDismissed ||
    props.currentVote !== null ||
    !selectedMessage
  )
    return null

  const { upVote, downVote, dismiss } = selectedMessage

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-[9998] w-80 max-w-[calc(100vw-2rem)] pointer-events-auto"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 relative">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
              {/* Header with icon, title, help button, and close button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <upVote.Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {selectedMessage.label}
                  </span>
                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="How does verification work?"
                    type="button"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  title={dismiss.label}
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {selectedMessage.text}
              </p>

              {/* Vote buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleVote(true)}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                >
                  <upVote.Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{upVote.label}</span>
                </button>

                <button
                  onClick={() => handleVote(false)}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700"
                >
                  <downVote.Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{downVote.label}</span>
                </button>

                {/* Dismiss button */}
                <button
                  onClick={handleDismiss}
                  type="button"
                  className="w-full px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  {dismiss.label}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <VotingHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </>
  )
}

export default VoteReminderBanner
