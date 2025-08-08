'use client'

import { motion } from 'framer-motion'
import { ImageIcon } from 'lucide-react'
import SearchResultsCard from '@/app/games/new/search/components/SearchResultsCard'
import type { TGDBGame, TGDBGamesByNameResponse } from '@/types/tgdb'

interface SearchResultsProps {
  searchResults: TGDBGamesByNameResponse | null
  onPreview: (game: TGDBGame) => void
  onSelect: (game: TGDBGame, extras: { isErotic: boolean }) => void
  isSelecting: boolean
  existingGames: Record<number, { id: string; title: string; systemName: string }>
}

function SearchResults(props: SearchResultsProps) {
  if (!props.searchResults?.data?.games) return null

  if (props.searchResults.data.games.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center"
      >
        <ImageIcon className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No games found</h3>
        <p className="text-slate-600 dark:text-slate-400">
          Try adjusting your search query or selecting a different system
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Search Results</h2>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Found {props.searchResults.data.games.length} game
          {props.searchResults.data.games.length !== 1 ? 's' : ''}
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-stretch"
      >
        {props.searchResults.data.games.map((game) => (
          <SearchResultsCard
            key={game.id}
            game={game}
            searchResponse={props.searchResults!}
            onPreview={props.onPreview}
            onSelect={props.onSelect}
            isSelecting={props.isSelecting}
            existingGames={props.existingGames}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}

export default SearchResults
