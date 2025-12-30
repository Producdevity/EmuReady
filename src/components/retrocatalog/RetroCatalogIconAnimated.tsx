'use client'

import { motion, useAnimation } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showAccent?: boolean
  color?: string
  /** Whether to animate on mount. Defaults to true. */
  animate?: boolean
  /** Callback when animation completes */
  onAnimationComplete?: () => void
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

// ABXY button colors
const BUTTON_COLORS = {
  bottom: '#10B981', // emerald-500 (A - Green)
  right: '#EF4444', // red-500 (B - Red)
  left: '#3B82F6', // blue-500 (X - Blue)
  top: '#F59E0B', // amber-500 (Y - Yellow)
} as const

type ButtonId = keyof typeof BUTTON_COLORS
const PRESS_SEQUENCE: ButtonId[] = ['bottom', 'right', 'left', 'top']

/**
 * Animated RetroCatalog logo icon - plays ABXY button press sequence on mount
 * followed by 360° rotation, then returns to original state
 */
export function RetroCatalogIconAnimated(props: Props) {
  const { size = 'md', showAccent = false, animate = true } = props

  // Animation controllers
  const rootControls = useAnimation()
  const bottomControls = useAnimation()
  const leftControls = useAnimation()
  const topControls = useAnimation()
  const rightControls = useAnimation()

  // Color state for each button
  const [colors, setColors] = useState({
    bottom: 'currentColor',
    left: 'currentColor',
    top: 'currentColor',
    right: 'currentColor',
  })

  // Track if animation has run
  const hasAnimated = useRef(false)

  // Determine base color
  const useAccentClass = !props.color && showAccent
  const baseColor = props.color ?? (showAccent ? undefined : 'currentColor')

  useEffect(() => {
    if (!animate || hasAnimated.current) return

    // Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      props.onAnimationComplete?.()
      return
    }

    hasAnimated.current = true

    // Map button IDs to their controllers
    const controlsMap = {
      bottom: bottomControls,
      left: leftControls,
      top: topControls,
      right: rightControls,
    }

    const runAnimation = async () => {
      // Small delay to ensure component is visible
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Phase 1: Sequential button presses (deliberate)
      for (const buttonId of PRESS_SEQUENCE) {
        setColors((prev) => ({ ...prev, [buttonId]: BUTTON_COLORS[buttonId] }))

        // Press down (deliberate hold)
        await controlsMap[buttonId].start({
          opacity: 0.4,
          scale: 0.8,
          transition: { duration: 0.1 },
        })

        // Brief hold at pressed state
        await new Promise((resolve) => setTimeout(resolve, 60))

        // Release (snap back)
        await controlsMap[buttonId].start({
          opacity: 1,
          scale: 1,
          transition: { duration: 0.1 },
        })
      }

      // Phase 2: 360° rotation with centrifugal expansion effect
      // Expand circles outward as rotation starts (centrifugal force)
      const expandAmount = 2 // pixels
      await Promise.all([
        bottomControls.start({ y: expandAmount, transition: { duration: 0.1 } }),
        topControls.start({ y: -expandAmount, transition: { duration: 0.1 } }),
        leftControls.start({ x: -expandAmount, transition: { duration: 0.1 } }),
        rightControls.start({ x: expandAmount, transition: { duration: 0.1 } }),
      ])

      // Rotate while expanded
      await rootControls.start({
        rotate: 360,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      })

      // Elastic snap back to original positions
      await Promise.all([
        bottomControls.start({ y: 0, transition: { type: 'spring', stiffness: 600, damping: 15 } }),
        topControls.start({ y: 0, transition: { type: 'spring', stiffness: 600, damping: 15 } }),
        leftControls.start({ x: 0, transition: { type: 'spring', stiffness: 600, damping: 15 } }),
        rightControls.start({ x: 0, transition: { type: 'spring', stiffness: 600, damping: 15 } }),
      ])

      // Phase 3: Reset colors
      setColors({
        bottom: 'currentColor',
        left: 'currentColor',
        top: 'currentColor',
        right: 'currentColor',
      })

      // Quick scale bounce
      await rootControls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.2 },
      })

      // Reset rotation for potential future animations
      rootControls.set({ rotate: 0 })

      props.onAnimationComplete?.()
    }

    runAnimation().catch((error) =>
      logger.error('[RetroCatalogIconAnimated] runAnimation error:', error),
    )
  }, [animate, bottomControls, leftControls, topControls, rightControls, rootControls, props])

  return (
    <motion.svg
      viewBox="0 0 1805 1846"
      className={cn(
        sizeMap[size],
        'flex-shrink-0',
        useAccentClass ? 'text-brand-retrocatalog' : '',
        props.className,
      )}
      aria-hidden="true"
      animate={rootControls}
      initial={{ rotate: 0, scale: 1 }}
      style={{
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        strokeLinejoin: 'round',
        strokeMiterlimit: 2,
        color: baseColor,
      }}
    >
      <g transform="matrix(1,0,0,1,-624.35,-289.306)">
        {/* Bottom circle unit (A button) */}
        <g transform="matrix(1,0,0,1,0,-3.95154)">
          <motion.g
            animate={bottomControls}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            style={{ transformOrigin: '1528px 1780px', transformBox: 'fill-box' }}
          >
            <path
              d="M1598.75,1528.65C1675.85,1543.77 1818.5,1678.05 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1518.32,2120.99 1435.64,2109.49 1311.73,2002.62C1357.74,2036.33 1414.48,2056.24 1475.84,2056.24C1629.33,2056.24 1753.94,1931.63 1753.94,1778.15C1753.94,1668.77 1690.66,1574.06 1598.75,1528.65Z"
              fill={colors.bottom}
              stroke={colors.bottom}
              strokeWidth={1}
              style={{ transition: 'fill 150ms ease, stroke 150ms ease' }}
            />
            <g transform="matrix(1.11585,0,0,1.11585,-203.197,-236.076)">
              <circle
                cx={1504.71}
                cy={1801.56}
                r={249.225}
                fill="none"
                stroke={colors.bottom}
                strokeWidth={36.91}
                strokeLinecap="round"
                style={{ transition: 'stroke 150ms ease' }}
              />
            </g>
            <path
              d="M1631.38,1546.9C1704.29,1594.93 1818.39,1677.58 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1517.12,2121.04 1437.74,2105.12 1305.83,1997.49"
              fill="none"
              stroke={colors.bottom}
              strokeWidth={41.18}
              style={{ transition: 'stroke 150ms ease' }}
            />
          </motion.g>
        </g>

        {/* Left circle unit (X button) */}
        <g transform="matrix(1,0,0,1,-552.798,-618.501)">
          <motion.g
            animate={leftControls}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            style={{ transformOrigin: '1528px 1780px', transformBox: 'fill-box' }}
          >
            <path
              d="M1598.75,1528.65C1675.85,1543.77 1818.5,1678.05 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1518.32,2120.99 1435.64,2109.49 1311.73,2002.62C1357.74,2036.33 1414.48,2056.24 1475.84,2056.24C1629.33,2056.24 1753.94,1931.63 1753.94,1778.15C1753.94,1668.77 1690.66,1574.06 1598.75,1528.65Z"
              fill={colors.left}
              stroke={colors.left}
              strokeWidth={1}
              style={{ transition: 'fill 150ms ease, stroke 150ms ease' }}
            />
            <g transform="matrix(1.11585,0,0,1.11585,-203.197,-232.125)">
              <circle
                cx={1504.71}
                cy={1801.56}
                r={249.225}
                fill="none"
                stroke={colors.left}
                strokeWidth={36.91}
                strokeLinecap="round"
                style={{ transition: 'stroke 150ms ease' }}
              />
            </g>
            <path
              d="M1631.38,1546.9C1704.29,1594.93 1818.39,1677.58 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1517.12,2121.04 1437.74,2105.12 1305.83,1997.49"
              fill="none"
              stroke={colors.left}
              strokeWidth={41.18}
              style={{ transition: 'stroke 150ms ease' }}
            />
          </motion.g>
        </g>

        {/* Top circle unit (Y button) */}
        <g transform="matrix(1,0,0,1,0,-1237)">
          <motion.g
            animate={topControls}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            style={{ transformOrigin: '1528px 1780px', transformBox: 'fill-box' }}
          >
            <g transform="matrix(1,0,0,1,0,46.8522)">
              <path
                d="M1598.75,1528.65C1675.85,1543.77 1818.5,1678.05 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1518.32,2120.99 1435.64,2109.49 1311.73,2002.62C1357.74,2036.33 1414.48,2056.24 1475.84,2056.24C1629.33,2056.24 1753.94,1931.63 1753.94,1778.15C1753.94,1668.77 1690.66,1574.06 1598.75,1528.65Z"
                fill={colors.top}
                stroke={colors.top}
                strokeWidth={1}
                style={{ transition: 'fill 150ms ease, stroke 150ms ease' }}
              />
            </g>
            <g transform="matrix(1.11585,0,0,1.11585,-203.197,-185.272)">
              <circle
                cx={1504.71}
                cy={1801.56}
                r={249.225}
                fill="none"
                stroke={colors.top}
                strokeWidth={36.91}
                strokeLinecap="round"
                style={{ transition: 'stroke 150ms ease' }}
              />
            </g>
            <g transform="matrix(1,0,0,1,0,46.8522)">
              <path
                d="M1631.38,1546.9C1704.29,1594.93 1818.39,1677.58 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1517.12,2121.04 1437.74,2105.12 1305.83,1997.49"
                fill="none"
                stroke={colors.top}
                strokeWidth={41.18}
                style={{ transition: 'stroke 150ms ease' }}
              />
            </g>
          </motion.g>
        </g>

        {/* Right circle unit (B button) */}
        <g transform="matrix(1,0,0,1,556.197,-618.501)">
          <motion.g
            animate={rightControls}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            style={{ transformOrigin: '1528px 1780px', transformBox: 'fill-box' }}
          >
            <path
              d="M1598.75,1528.65C1675.85,1543.77 1818.5,1678.05 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1518.32,2120.99 1435.64,2109.49 1311.73,2002.62C1357.74,2036.33 1414.48,2056.24 1475.84,2056.24C1629.33,2056.24 1753.94,1931.63 1753.94,1778.15C1753.94,1668.77 1690.66,1574.06 1598.75,1528.65Z"
              fill={colors.right}
              stroke={colors.right}
              strokeWidth={1}
              style={{ transition: 'fill 150ms ease, stroke 150ms ease' }}
            />
            <g transform="matrix(1.11585,0,0,1.11585,-203.197,-232.125)">
              <circle
                cx={1504.71}
                cy={1801.56}
                r={249.225}
                fill="none"
                stroke={colors.right}
                strokeWidth={36.91}
                strokeLinecap="round"
                style={{ transition: 'stroke 150ms ease' }}
              />
            </g>
            <path
              d="M1631.38,1546.9C1704.29,1594.93 1818.39,1677.58 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1517.12,2121.04 1437.74,2105.12 1305.83,1997.49"
              fill="none"
              stroke={colors.right}
              strokeWidth={41.18}
              style={{ transition: 'stroke 150ms ease' }}
            />
          </motion.g>
        </g>
      </g>
    </motion.svg>
  )
}
