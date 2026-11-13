'use client'

import { motion } from 'framer-motion'
import { BookmarkCheck } from 'lucide-react'
import Link from 'next/link'

function PrivacyNote() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="flex items-center gap-2 rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-2.5 dark:border-amber-700/30 dark:bg-amber-900/10"
    >
      <BookmarkCheck className="size-4 shrink-0 text-amber-500" />
      <p className="text-xs text-amber-700 dark:text-amber-300">
        Control who can see your bookmarks in{' '}
        <Link
          href="/profile?tab=privacy"
          className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
        >
          Privacy Settings
        </Link>
      </p>
    </motion.div>
  )
}

export default PrivacyNote
