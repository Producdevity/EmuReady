'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui'
import { useBookmarkToggle, type BookmarkConfig } from '@/hooks/useBookmarkToggle'
import { cn } from '@/lib/utils'

type Props = BookmarkConfig

function BookmarkButton(props: Props) {
  const { user, isBookmarked, isPending, isStatusPending, handleToggle } = useBookmarkToggle(props)

  if (!user) return null

  const disabled = isPending || isStatusPending

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          whileTap={{ scale: 0.85 }}
          aria-pressed={isBookmarked}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          className={cn(
            'relative flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 outline-none',
            'focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isBookmarked
              ? 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50'
              : 'text-gray-400 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800',
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isBookmarked ? (
              <motion.div
                key="bookmarked"
                initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotateY: 90 }}
                transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 20 }}
              >
                <BookmarkCheck className="size-5" />
              </motion.div>
            ) : (
              <motion.div
                key="bookmark"
                initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotateY: -90 }}
                transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Bookmark className="size-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {isBookmarked ? 'Remove bookmark' : 'Bookmark this listing'}
      </TooltipContent>
    </Tooltip>
  )
}

export default BookmarkButton
