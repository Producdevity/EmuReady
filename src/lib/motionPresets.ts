import { type MotionProps } from 'framer-motion'

export const motionPresets = {
  // Small badge/icon entrance with spring
  badgeIn: (delay = 0, stiffness = 300): MotionProps => ({
    initial: { x: -20, opacity: 0, scale: 0.8 },
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: { x: -20, opacity: 0, scale: 0.8 },
    transition: { delay, type: 'spring', stiffness },
  }),

  // Pop-in for small counters/badges
  countPop: (delay = 0): MotionProps => ({
    initial: { scale: 0 },
    animate: { scale: 1 },
    exit: { scale: 0 },
    transition: { delay, type: 'spring', stiffness: 400 },
  }),

  // General fade in up for sections
  fadeInUp: (delay = 0, duration = 0.3): MotionProps => ({
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
    transition: { delay, duration },
  }),

  // Row-by-row list item enter from left
  fadeInLeft: (delay = 0, duration = 0.3): MotionProps => ({
    initial: { x: -10, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -10, opacity: 0 },
    transition: { delay, duration },
  }),

  // Simple scale in for small elements
  scaleIn: (delay = 0): MotionProps => ({
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { delay },
  }),
}
