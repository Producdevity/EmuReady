'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Search, X } from 'lucide-react'
import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Props {
  search: string
  onSearchChange: (value: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  activeFilterCount?: number
}

export function SearchBar(props: Props) {
  const [isFocused, setIsFocused] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load search history from localStorage on mount
  useEffect(() => {
    const history = localStorage.getItem('v2-search-history')
    if (history) {
      try {
        setSearchHistory(JSON.parse(history).slice(0, 5)) // Keep only recent 5
      } catch (error) {
        console.warn('Failed to parse search history:', error)
      }
    }
  }, [])

  const handleSearchChange = (value: string) => {
    props.onSearchChange(value)
  }

  const handleSearchSubmit = () => {
    if (props.search.trim() && !searchHistory.includes(props.search.trim())) {
      const newHistory = [props.search.trim(), ...searchHistory].slice(0, 5)
      setSearchHistory(newHistory)
      localStorage.setItem('v2-search-history', JSON.stringify(newHistory))
    }
    inputRef.current?.blur()
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur()
    }
  }

  const handleHistorySelect = (term: string) => {
    props.onSearchChange(term)
    setIsFocused(false)
    inputRef.current?.blur()
  }

  const clearSearch = () => {
    props.onSearchChange('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative mb-4">
      <motion.div
        className={cn(
          'relative transition-all duration-200',
          isFocused ? 'transform scale-[1.02]' : '',
        )}
      >
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />

        <Input
          ref={inputRef}
          type="text"
          placeholder="Search games, devices, emulators..."
          value={props.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={handleKeyPress}
          className={cn(
            'pl-12 pr-24 h-14 text-base rounded-2xl transition-all duration-200',
            'border-2 bg-white dark:bg-gray-800',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            isFocused
              ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/10'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          )}
        />

        {/* Clear Search Button */}
        <AnimatePresence>
          {props.search && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={clearSearch}
              className="absolute right-20 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Filter Toggle Button */}
        <Button
          variant={props.showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={props.onToggleFilters}
          className={cn(
            'absolute right-2 top-1/2 transform -translate-y-1/2 transition-all duration-200',
            'flex items-center gap-2 px-3 py-2 rounded-xl',
            props.showFilters
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
          )}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {(props.activeFilterCount ?? 0) > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
            >
              {props.activeFilterCount}
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Search History Dropdown */}
      <AnimatePresence>
        {isFocused && searchHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Recent Searches
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {searchHistory.map((term, index) => (
                <motion.button
                  key={term}
                  onClick={() => handleHistorySelect(term)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 border-b border-gray-50 dark:border-gray-700 last:border-b-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{term}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
