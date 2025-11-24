'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

function NavbarExpandableSearch() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
    }
  }, [isExpanded])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isExpanded && !searchQuery) {
          setIsExpanded(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded, searchQuery])

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery) {
      router.push(`/games?search=${encodeURIComponent(trimmedQuery)}`)
      setSearchQuery('')
      setIsExpanded(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmedQuery = searchQuery.trim()
      if (trimmedQuery) {
        router.push(`/games?search=${encodeURIComponent(trimmedQuery)}`)
        setSearchQuery('')
        setIsExpanded(false)
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('')
      setIsExpanded(false)
    }
  }

  function handleClear() {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="search-button"
            onClick={() => setIsExpanded(true)}
            className={cn(
              'relative flex items-center justify-center rounded-xl px-4 py-2.5 font-semibold text-sm overflow-hidden group',
              'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400',
              'hover:bg-gray-50/80 dark:hover:bg-gray-800/50',
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Search games"
          >
            <motion.div
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <Search className="h-5 w-5" />
            </motion.div>
          </motion.button>
        ) : (
          <motion.form
            key="search-form"
            onSubmit={handleSearch}
            initial={{ width: 48, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 48, opacity: 0 }}
            transition={{
              width: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
            }}
            className="relative"
          >
            <motion.div
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5',
                'bg-white/90 dark:bg-gray-800/90 backdrop-blur-md',
                'ring-2 ring-blue-500/40 dark:ring-blue-400/40',
                'shadow-lg shadow-blue-500/10 dark:shadow-blue-400/20',
              )}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.05, duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                <Search className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              </motion.div>

              <motion.input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search games..."
                className={cn(
                  'w-32 sm:w-40 md:w-56 bg-transparent text-sm font-medium',
                  'text-gray-900 dark:text-gray-100',
                  'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                  'focus:outline-none',
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              />

              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    type="button"
                    onClick={handleClear}
                    className={cn(
                      'flex-shrink-0 rounded-lg p-1',
                      'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      'transition-colors duration-150',
                    )}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NavbarExpandableSearch
