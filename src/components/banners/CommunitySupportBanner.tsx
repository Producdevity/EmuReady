'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import { useCommunitySupportBanner } from '@/hooks/useCommunitySupportBanner'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { env } from '@/lib/env'
import { cn } from '@/lib/utils'

type BannerVariant = 'home' | 'list' | 'detail'

interface Props {
  variant: BannerVariant
  page: string
}

function CommunitySupportBanner(props: Props) {
  const { isVisible, dismiss, handleCTAClick } = useCommunitySupportBanner({
    variant: props.variant,
    page: props.page,
  })

  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const isHome = props.variant === 'home'

  const motionProps = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
      }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          {...motionProps}
          role="complementary"
          aria-label="Community support"
          className={cn(
            'relative overflow-hidden rounded-xl border shadow-sm backdrop-blur-xl',
            'bg-gradient-to-r from-white/80 via-blue-50/60 to-purple-50/60',
            'border-blue-200/50',
            'dark:[background-image:none] dark:bg-gray-800/50',
            'dark:border-gray-700/40',
            isHome ? 'mb-12 p-5 md:p-6' : 'mb-4 p-3 md:p-4',
          )}
        >
          <div
            className={cn(
              'flex flex-wrap items-start gap-x-3 gap-y-2.5',
              'sm:flex-nowrap sm:items-center',
              isHome ? 'md:gap-x-4' : '',
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950/30 dark:to-rose-950/30',
                isHome ? 'p-2.5' : 'p-2',
              )}
            >
              <Heart
                className={cn('text-pink-600 dark:text-pink-400', isHome ? 'h-5 w-5' : 'h-4 w-4')}
                aria-hidden="true"
              />
            </div>

            {/* Text — min-width ensures icon + text + dismiss fill the first row, forcing CTA to wrap */}
            <p
              className={cn(
                'flex-1 text-gray-700 dark:text-gray-200 leading-snug',
                'min-w-[calc(100%-7rem)] sm:min-w-0',
                isHome ? 'text-sm md:text-base' : 'text-xs md:text-sm',
              )}
            >
              <span className="font-semibold">EmuReady is open source, free, and ad-free,</span> but
              keeping it online isn&apos;t. Patreon supporters help with hosting and bandwidth.
            </p>

            {/* CTA — wraps to second line on mobile via order-1, inline on desktop */}
            <a
              href={env.PATREON_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCTAClick}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
                'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
                'text-white shadow-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                'dark:focus-visible:ring-offset-gray-900',
                'order-1 w-full sm:order-none sm:w-auto sm:flex-shrink-0',
                isHome ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
              )}
            >
              <Heart className={cn(isHome ? 'h-4 w-4' : 'h-3.5 w-3.5')} aria-hidden="true" />
              Support Us
            </a>

            {/* Dismiss — stays in first row (default order 0, same as icon + text) */}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss community support banner"
              className={cn(
                'flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors',
                'hover:text-gray-600 hover:bg-gray-100',
                'dark:hover:text-gray-300 dark:hover:bg-gray-800',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              )}
            >
              <X className={cn(isHome ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

export default CommunitySupportBanner
