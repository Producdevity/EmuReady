'use client'

import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
} from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useState, useRef, useEffect, type PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

interface Props extends PropsWithChildren {
  onRefresh: () => Promise<void>
  pullDistance?: number
  className?: string
  refreshingText?: string
  pullingText?: string
  releaseText?: string
  enableHaptics?: boolean
}

export function PullToRefresh({
  onRefresh,
  children,
  pullDistance = 100,
  className,
  refreshingText = 'Refreshing...',
  pullingText = 'Pull to refresh',
  releaseText = 'Release to refresh',
  enableHaptics = true,
}: Props) {
  const [refreshing, setRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const y = useMotionValue(0)
  const controls = useAnimation()

  // Transform the pull indicator's opacity and scale based on pull distance
  const indicatorOpacity = useTransform(
    y,
    [0, pullDistance * 0.4, pullDistance],
    [0, 0.8, 1],
  )

  const indicatorScale = useTransform(y, [0, pullDistance], [0.8, 1])

  const indicatorRotate = useTransform(y, [0, pullDistance], [0, 180])

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Handle touch start
    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull to refresh when at top of the page
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY
        setIsPulling(true)
      }
    }

    // Handle touch move
    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return

      currentY.current = e.touches[0].clientY
      const pullLength = Math.max(0, currentY.current - startY.current)

      // Apply resistance to the pull
      const resistance = 0.4
      const newY = pullLength * resistance

      if (newY > 0) {
        // Prevent default only when actually pulling down
        e.preventDefault()
        y.set(newY)
        setCanRefresh(newY >= pullDistance)
      }
    }

    // Handle touch end
    const handleTouchEnd = async () => {
      if (!isPulling) return

      if (canRefresh) {
        // Trigger haptic feedback if available
        if (enableHaptics && navigator.vibrate) {
          navigator.vibrate([20, 40, 20])
        }

        setRefreshing(true)
        controls.start({ y: pullDistance * 0.4 })

        try {
          await onRefresh()
        } finally {
          setRefreshing(false)
          controls.start({ y: 0 })
        }
      } else {
        controls.start({ y: 0 })
      }

      setIsPulling(false)
      setCanRefresh(false)
    }

    container.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [
    isPulling,
    canRefresh,
    pullDistance,
    onRefresh,
    enableHaptics,
    controls,
    y,
  ])

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden touch-manipulation', className)}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center py-3 pointer-events-none"
        style={{
          y,
          opacity: indicatorOpacity,
        }}
        animate={controls}
      >
        <motion.div
          style={{
            scale: indicatorScale,
            rotate: indicatorRotate,
          }}
          className="bg-primary/10 rounded-full p-2"
        >
          <ArrowDown className="h-5 w-5 text-primary" />
        </motion.div>
        <div className="mt-2 text-sm font-medium text-primary">
          {refreshing ? refreshingText : canRefresh ? releaseText : pullingText}
        </div>
      </motion.div>

      {/* Content */}
      {children}
    </div>
  )
}
