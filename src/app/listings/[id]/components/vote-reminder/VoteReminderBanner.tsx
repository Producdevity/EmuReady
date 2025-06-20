'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'
import storageKeys from '@/data/storageKeys'
import useLocalStorage from '@/hooks/useLocalStorage'
import analytics from '@/lib/analytics'
import voteReminderMessages from './voteReminderMessages'

interface Props {
  listingId: string
  onVoteClick: () => void
  currentVote: boolean | null
  onVote: (value: boolean | null) => void
}

const TIME_ON_PAGE_SECONDS = 60

function VoteReminderBanner(props: Props) {
  const [showReminder, setShowReminder] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenDismissed, setHasBeenDismissed] = useLocalStorage(
    storageKeys.voteReminderDismissed,
    false,
  )

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
    if (hasBeenDismissed) return

    const timer = setTimeout(() => {
      setShowReminder(true)
      analytics.engagement.voteReminderShown({
        listingId: props.listingId,
        timeOnPage: getTimeOnPage(),
      })
      setTimeout(() => setIsVisible(true), 100)
    }, TIME_ON_PAGE_SECONDS * 1000)

    return () => clearTimeout(timer)
  }, [hasBeenDismissed, props.listingId])

  const handleDismiss = () => {
    analytics.engagement.voteReminderDismissed({
      listingId: props.listingId,
      timeOnPage: getTimeOnPage(),
    })

    setIsVisible(false)
    setTimeout(() => {
      setShowReminder(false)
      setHasBeenDismissed(true)
    }, 300) // Wait for exit animation
  }

  const handleVote = (voteValue: boolean | null) => {
    analytics.engagement.voteReminderClicked({
      listingId: props.listingId,
      timeOnPage: getTimeOnPage(),
    })

    props.onVote(voteValue)
    setIsVisible(false)
    setTimeout(() => setShowReminder(false), 300)
  }

  if (!showReminder || hasBeenDismissed || !selectedMessage) return null

  const { upVote, downVote, dismiss } = selectedMessage

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            opacity: { duration: 0.2 },
          }}
          className="fixed right-2 top-1/2 -translate-y-1/2 z-40 w-72 max-w-[calc(100vw-1rem)] sm:w-80 sm:right-4 sm:max-w-sm"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 relative overflow-hidden">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10" />

            {/* Content */}
            <div className="relative">
              {/* Header with icon and close button */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, -5, 5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 5,
                      ease: 'easeInOut',
                    }}
                    className="flex-shrink-0"
                  >
                    <upVote.Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {selectedMessage.label}
                  </span>
                </div>

                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ml-1 sm:ml-2"
                  title={dismiss.label}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                {selectedMessage.text}
              </p>

              {/* Vote buttons - responsive layout */}
              <div className="flex flex-col gap-2">
                {/* Main vote buttons */}
                <div className="flex flex-col gap-2">
                  <motion.button
                    onClick={() => handleVote(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm min-h-[44px] ${
                      props.currentVote === true
                        ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white'
                        : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400'
                    }`}
                  >
                    <upVote.Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-center leading-tight">
                      {upVote.label}
                    </span>
                  </motion.button>

                  <motion.button
                    onClick={() => handleVote(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm min-h-[48px] ${
                      props.currentVote === false
                        ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white'
                        : 'bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400'
                    }`}
                  >
                    <downVote.Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-center leading-tight">
                      {downVote.label}
                    </span>
                  </motion.button>
                </div>

                {/* Dismiss button */}
                <motion.button
                  onClick={handleDismiss}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-center leading-tight"
                  title="Dismiss reminder"
                >
                  {dismiss.label}
                </motion.button>
              </div>
            </div>

            {/* Subtle pulse border animation */}
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-blue-200 dark:border-blue-800"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.005, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default VoteReminderBanner
