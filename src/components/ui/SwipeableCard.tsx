import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { PanInfo } from 'framer-motion'
import type { ReactNode } from 'react'

interface SwipeableCardProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onClick?: () => void
  className?: string
  swipeThreshold?: number
  enableHaptics?: boolean
}

function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onClick,
  className,
  swipeThreshold = 100,
  enableHaptics = true,
}: SwipeableCardProps) {
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)
  const x = useMotionValue(0)

  // Transform the card's opacity and rotation based on the swipe distance
  const opacity = useTransform(
    x,
    [-swipeThreshold * 2, 0, swipeThreshold * 2],
    [0.5, 1, 0.5],
  )

  const rotate = useTransform(
    x,
    [-swipeThreshold * 2, 0, swipeThreshold * 2],
    [-8, 0, 8],
  )

  // Handle drag start
  const handleDragStart = (event: MouseEvent | TouchEvent | PointerEvent) => {
    setIsSwiping(true)

    // Store the starting position for touch events
    if (event.type === 'touchstart') {
      const touchEvent = event as TouchEvent
      startX.current = touchEvent.touches[0].clientX
    } else {
      startX.current = (event as MouseEvent).clientX
    }
  }

  // Handle drag end
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    _info: PanInfo,
  ) => {
    const xOffset = x.get()

    // Reset position
    x.set(0)

    // If the card was swiped far enough, trigger the appropriate callback
    if (xOffset < -swipeThreshold && onSwipeLeft) {
      onSwipeLeft()

      // Trigger haptic feedback if available
      if (enableHaptics && navigator.vibrate) {
        navigator.vibrate(50)
      }
    } else if (xOffset > swipeThreshold && onSwipeRight) {
      onSwipeRight()

      // Trigger haptic feedback if available
      if (enableHaptics && navigator.vibrate) {
        navigator.vibrate(50)
      }
    }

    setIsSwiping(false)
  }

  // Handle click
  const handleClick = () => {
    // Only trigger click if we're not swiping
    if (!isSwiping && onClick) {
      onClick()
    }
  }

  return (
    <motion.div
      className={cn('touch-manipulation cursor-pointer', className)}
      style={{
        x,
        opacity,
        rotate,
        touchAction: 'pan-y',
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      whileTap={{ scale: isSwiping ? 1 : 0.98 }}
    >
      {children}
    </motion.div>
  )
}

export default SwipeableCard
