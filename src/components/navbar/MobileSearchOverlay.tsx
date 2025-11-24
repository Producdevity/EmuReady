'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const FOCUS_DELAY_MS = 300
const BACKDROP_BLUR_PX = 20

interface MobileSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

function MobileSearchOverlay(props: MobileSearchOverlayProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let focusTimeoutId: NodeJS.Timeout | undefined

    if (props.isOpen) {
      document.body.style.overflow = 'hidden'
      focusTimeoutId = setTimeout(() => {
        inputRef.current?.focus()
      }, FOCUS_DELAY_MS)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      if (focusTimeoutId) {
        clearTimeout(focusTimeoutId)
      }
    }
  }, [props.isOpen])

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery) {
      router.push(`/games?search=${encodeURIComponent(trimmedQuery)}`)
      setSearchQuery('')
      props.onClose()
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setSearchQuery('')
      props.onClose()
    }
  }

  function handleClear() {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {props.isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50"
            style={{ WebkitBackdropFilter: `blur(${BACKDROP_BLUR_PX}px)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleBackdropClick}
          />

          <motion.div
            className="fixed top-0 left-0 right-0 z-50 pt-4 sm:pt-20 px-4"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
          >
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3 sm:mb-0">
                <motion.button
                  type="button"
                  onClick={props.onClose}
                  className={cn(
                    'flex items-center justify-center',
                    'w-10 h-10 rounded-full',
                    'bg-white/10 backdrop-blur-md',
                    'text-white hover:bg-white/20',
                    'transition-colors duration-150',
                    'sm:hidden',
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </motion.button>
                <motion.p
                  className="text-sm text-white/70 sm:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                >
                  Tap outside to close
                </motion.p>
                <div className="w-10 sm:hidden" />
              </div>

              <motion.form
                onSubmit={handleSearch}
                className="relative"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 sm:px-6 py-3 sm:py-4',
                    'bg-white dark:bg-gray-800 shadow-2xl',
                    'ring-2 ring-blue-500/30 dark:ring-blue-400/30',
                  )}
                >
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 dark:text-blue-400 flex-shrink-0" />

                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search games..."
                    className={cn(
                      'flex-1 bg-transparent text-base sm:text-lg font-medium',
                      'text-gray-900 dark:text-gray-100',
                      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                      'focus:outline-none',
                    )}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                  />

                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        type="button"
                        onClick={handleClear}
                        className={cn(
                          'flex-shrink-0 rounded-full p-1.5 sm:p-2',
                          'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
                          'hover:bg-gray-100 dark:hover:bg-gray-700',
                          'transition-colors duration-150',
                        )}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  type="button"
                  onClick={props.onClose}
                  className={cn(
                    'hidden sm:flex absolute -top-12 right-0 items-center justify-center',
                    'w-10 h-10 rounded-full',
                    'bg-white/10 backdrop-blur-md',
                    'text-white hover:bg-white/20',
                    'transition-colors duration-150',
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </motion.form>

              <motion.p
                className="hidden sm:block mt-4 text-center text-sm text-white/70"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.2 }}
              >
                Press ESC to close
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default MobileSearchOverlay
