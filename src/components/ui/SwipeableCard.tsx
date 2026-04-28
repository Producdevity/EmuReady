'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { type PropsWithChildren, type MouseEvent, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PanInfo } from 'framer-motion'

interface Props extends PropsWithChildren {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onClick?: (e: MouseEvent) => void
  className?: string
  swipeThreshold?: number
  enableHaptics?: boolean
}

export function SwipeableCard(props: Props) {
  const swipeThreshold = props.swipeThreshold ?? 100
  const enableHaptics = props.enableHaptics ?? true

  const [isSwiping, setIsSwiping] = useState(false)
  const x = useMotionValue(0)

  const opacity = useTransform(x, [-swipeThreshold * 2, 0, swipeThreshold * 2], [0.5, 1, 0.5])

  const rotate = useTransform(x, [-swipeThreshold * 2, 0, swipeThreshold * 2], [-8, 0, 8])

  const handleDragEnd = (_event: unknown, _info: PanInfo) => {
    const xOffset = x.get()

    x.set(0)

    if (xOffset < -swipeThreshold && props.onSwipeLeft) {
      props.onSwipeLeft()

      if (enableHaptics && navigator.vibrate) {
        navigator.vibrate(50)
      }
    } else if (xOffset > swipeThreshold && props.onSwipeRight) {
      props.onSwipeRight()

      if (enableHaptics && navigator.vibrate) navigator.vibrate(50)
    }

    setIsSwiping(false)
  }

  const handleClick = (e: MouseEvent) => {
    if (!isSwiping && props.onClick) props.onClick(e)
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
      onDragStart={() => setIsSwiping(true)}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      whileTap={{ scale: isSwiping ? 1 : 0.98 }}
    >
      {props.children}
    </motion.div>
  )
}
