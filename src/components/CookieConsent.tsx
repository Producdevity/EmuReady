'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Settings,
  Shield,
  BarChart3,
  Target,
  Cookie,
  Check,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { cn } from '@/lib/utils'

type CookieCategory = 'necessary' | 'analytics' | 'performance'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  performance: boolean
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  performance: false,
}

const COOKIE_CATEGORIES = {
  necessary: {
    icon: Shield,
    title: 'Necessary Cookies',
    description:
      'Essential for the website to function properly. These cannot be disabled.',
    required: true,
    color: 'emerald',
  },
  analytics: {
    icon: BarChart3,
    title: 'Analytics Cookies',
    description:
      'Help us understand how you use our site to improve user experience.',
    required: false,
    color: 'blue',
  },
  performance: {
    icon: Target,
    title: 'Performance Cookies',
    description:
      'Monitor site performance and loading times to optimize functionality.',
    required: false,
    color: 'purple',
  },
} as const

const colorClasses = {
  emerald: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    toggle: 'bg-emerald-600',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  blue: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    toggle: 'bg-blue-600',
    border: 'border-blue-200 dark:border-blue-800',
  },
  purple: {
    icon: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    toggle: 'bg-purple-600',
    border: 'border-purple-200 dark:border-purple-800',
  },
}

function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [savedPreferences, setSavedPreferences] =
    useLocalStorage<CookiePreferences | null>(
      storageKeys.cookies.preferences,
      null,
    )
  const [hasConsented, setHasConsented] = useLocalStorage<boolean>(
    storageKeys.cookies.consent,
    false,
  )
  const [, setConsentDate] = useLocalStorage<string | null>(
    storageKeys.cookies.consentDate,
    null,
  )
  const [, setAnalyticsEnabled] = useLocalStorage<boolean>(
    storageKeys.cookies.analyticsEnabled,
    false,
  )
  const [, setPerformanceEnabled] = useLocalStorage<boolean>(
    storageKeys.cookies.performanceEnabled,
    false,
  )
  const [preferences, setPreferences] = useState<CookiePreferences>(
    savedPreferences || DEFAULT_PREFERENCES,
  )
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    if (savedPreferences) {
      setPreferences(savedPreferences)
      setHasInteracted(true)
    }

    // Show banner if user hasn't consented yet
    if (!hasConsented && !hasInteracted) {
      // Small delay to avoid being too aggressive
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [hasInteracted, savedPreferences, hasConsented])

  const savePreferences = (newPreferences: CookiePreferences) => {
    setSavedPreferences(newPreferences)
    setHasConsented(true)
    setConsentDate(new Date().toISOString())

    // Apply preferences immediately
    setAnalyticsEnabled(newPreferences.analytics)
    setPerformanceEnabled(newPreferences.performance)

    setPreferences(newPreferences)
    setIsVisible(false)
    setHasInteracted(true)
  }

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      performance: true,
    }
    savePreferences(allAccepted)
  }

  const handleCategoryToggle = (category: CookieCategory) => {
    if (category === 'necessary') return // Cannot disable necessary cookies

    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-end justify-center pointer-events-none p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px] pointer-events-auto"
          onClick={() => setIsVisible(false)}
        />

        {/* Cookie Banner */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 400,
            duration: 0.3,
          }}
          className="w-full max-w-5xl pointer-events-auto relative"
        >
          <div className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
            {/* Header */}
            <div className="relative px-6 py-4 border-b border-gray-200/60 dark:border-gray-700/60">
              <div className="flex items-start justify-between">
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="relative">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-2.5 rounded-lg">
                      <Cookie className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Cookie Preferences
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      We use cookies to enhance your browsing experience
                    </p>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsVisible(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close cookie banner"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {!showDetails ? (
                /* Simple View */
                <motion.div
                  key="simple"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="px-6 py-5"
                >
                  <div className="space-y-5">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      We use cookies to improve your experience and analyze site
                      traffic. Choose which types of cookies you&apos;d like to
                      allow to help us provide you with the best possible
                      experience.
                    </p>

                    <div className="flex flex-wrap gap-2.5 justify-end">
                      <Button
                        onClick={() => setShowDetails(true)}
                        variant="ghost"
                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-5 py-2 h-auto font-medium"
                        size="sm"
                      >
                        <Settings className="w-4 h-4 mr-1.5" />
                        Customize
                      </Button>

                      <Button
                        onClick={() => savePreferences(DEFAULT_PREFERENCES)}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 px-5 py-2 h-auto font-medium"
                        size="sm"
                      >
                        Necessary Only
                      </Button>
                      <Button
                        onClick={handleAcceptAll}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-5 py-2 h-auto font-medium shadow-sm"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Accept All
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Detailed View */
                <motion.div
                  key="detailed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="px-6 py-5"
                >
                  <div className="space-y-5">
                    <div className="grid gap-3">
                      {Object.entries(COOKIE_CATEGORIES).map(
                        ([key, category], index) => {
                          const Icon = category.icon
                          const isEnabled = preferences[key as CookieCategory]
                          const colors = colorClasses[category.color]

                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={cn(
                                'group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200',
                                colors.bg,
                                isEnabled
                                  ? cn(colors.border, 'shadow-sm')
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                              )}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                <div
                                  className={cn('p-1.5 rounded-md', colors.bg)}
                                >
                                  <Icon
                                    className={cn('w-4 h-4', colors.icon)}
                                  />
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {category.title}
                                  </h4>

                                  <button
                                    onClick={() =>
                                      handleCategoryToggle(
                                        key as CookieCategory,
                                      )
                                    }
                                    disabled={category.required}
                                    className={cn(
                                      'relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95',
                                      isEnabled
                                        ? colors.toggle
                                        : 'bg-gray-300 dark:bg-gray-600',
                                      category.required &&
                                        'opacity-60 cursor-not-allowed',
                                    )}
                                  >
                                    <motion.span
                                      layout
                                      transition={{
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 30,
                                      }}
                                      className={cn(
                                        'inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform',
                                        isEnabled
                                          ? 'translate-x-5'
                                          : 'translate-x-1',
                                      )}
                                    />
                                  </button>
                                </div>

                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-1">
                                  {category.description}
                                </p>

                                {category.required && (
                                  <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                                  >
                                    <Shield className="w-3 h-3" />
                                    Always Active
                                  </motion.span>
                                )}
                              </div>
                            </motion.div>
                          )
                        },
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="transform transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
                        <Button
                          onClick={() => setShowDetails(false)}
                          variant="ghost"
                          className="px-5 py-2 h-auto font-medium"
                          size="sm"
                        >
                          Back
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        <div className="transform transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
                          <Button
                            onClick={handleAcceptAll}
                            variant="outline"
                            className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 px-5 py-2 h-auto font-medium"
                            size="sm"
                          >
                            Accept All
                          </Button>
                        </div>

                        <div className="transform transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
                          <Button
                            onClick={() => savePreferences(preferences)}
                            className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-5 py-2 h-auto font-medium shadow-sm"
                            size="sm"
                          >
                            <Check className="w-4 h-4 mr-1.5" />
                            Save Preferences
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CookieConsent
