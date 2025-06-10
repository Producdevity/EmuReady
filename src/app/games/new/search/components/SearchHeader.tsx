'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'

function SearchHeader() {
  const router = useRouter()

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            onClick={() => router.push('/games/new')}
            variant="ghost"
            size="sm"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manual Entry
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Search Game Database
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Find games from TheGamesDB with accurate metadata and high-quality
          artwork
        </p>
      </motion.div>
    </div>
  )
}

export default SearchHeader
