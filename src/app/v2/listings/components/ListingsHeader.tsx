'use client'

import { motion } from 'framer-motion'
import { Grid, List, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Props {
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  listingsCount: number
  isLoading: boolean
}

export function ListingsHeader(props: Props) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-2"
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Game Listings
            </h1>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full border border-blue-200 dark:border-blue-800"
            >
              <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                V2
              </span>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {props.isLoading ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full"
                />
                Loading listings...
              </span>
            ) : (
              <span>
                {props.listingsCount.toLocaleString()} listing
                {props.listingsCount !== 1 ? 's' : ''} found
              </span>
            )}
          </motion.p>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {/* View Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => props.setViewMode('grid')}
              className={cn(
                'rounded-none px-3 py-2 transition-all duration-200',
                props.viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400',
              )}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => props.setViewMode('list')}
              className={cn(
                'rounded-none px-3 py-2 transition-all duration-200',
                props.viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400',
              )}
            >
              <List className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Add Listing Desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden md:block"
          >
            <Link href="/listings/new">
              <Button
                size="sm"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Listing
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Add Listing FAB */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="md:hidden fixed bottom-6 left-4 z-30"
      >
        <Link href="/listings/new">
          <Button
            size="sm"
            className="h-12 w-12 rounded-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-2 border-green-500"
            title="Add new listing"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </Link>
      </motion.div>
    </>
  )
}
