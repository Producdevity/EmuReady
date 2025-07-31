'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useState } from 'react'
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

export function SwipeableCard(props: SwipeableCardProps) {
  const swipeThreshold = props.swipeThreshold ?? 100
  const enableHaptics = props.enableHaptics ?? true

  const [isSwiping, setIsSwiping] = useState(false)
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
  const handleDragStart = () => {
    setIsSwiping(true)
  }

  // Handle drag end
  const handleDragEnd = (_event: unknown, _info: PanInfo) => {
    const xOffset = x.get()

    // Reset position
    x.set(0)

    // If the card was swiped far enough, trigger the appropriate callback
    if (xOffset < -swipeThreshold && props.onSwipeLeft) {
      props.onSwipeLeft()

      // Trigger haptic feedback if available
      if (enableHaptics && navigator.vibrate) {
        navigator.vibrate(50)
      }
    } else if (xOffset > swipeThreshold && props.onSwipeRight) {
      props.onSwipeRight()

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
    if (!isSwiping && props.onClick) {
      props.onClick()
    }
  }

  return (
    <motion.div
      className={cn('touch-manipulation cursor-pointer', props.className)}
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
      {props.children}
    </motion.div>
  )
}
