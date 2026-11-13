'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useBookmarkToggle, type BookmarkConfig } from '../hooks/useBookmarkToggle'
import { type BookmarkStatus } from '../hooks/useBulkBookmarkStatuses'

type Props = BookmarkConfig & {
  status?: BookmarkStatus
}

function BookmarkButton(props: Props) {
  const { user, isBookmarked, isPending, isStatusPending, isStatusError, handleToggle } =
    useBookmarkToggle(props, props.status)

  if (!user) return null

  const disabled = isPending || isStatusPending || isStatusError
  const actionLabel = isStatusError
    ? 'Bookmark status unavailable'
    : isBookmarked
      ? 'Remove bookmark'
      : 'Add bookmark'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            if (!disabled) handleToggle()
          }}
          onAuxClick={(event) => event.stopPropagation()}
          disabled={disabled && !isStatusError}
          aria-disabled={disabled}
          whileTap={disabled ? undefined : { scale: 0.85 }}
          aria-pressed={isStatusPending || isStatusError ? undefined : isBookmarked}
          aria-label={actionLabel}
          className={cn(
            'relative flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 outline-none',
            'focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            'aria-disabled:opacity-50 aria-disabled:cursor-not-allowed',
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
      <TooltipContent side="top">{actionLabel}</TooltipContent>
    </Tooltip>
  )
}

export default BookmarkButton
