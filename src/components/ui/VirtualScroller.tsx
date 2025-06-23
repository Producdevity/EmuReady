import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface Props<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  itemHeight: number | ((item: T, index: number) => number)
  className?: string
  overscan?: number
  scrollingDelay?: number
  onEndReached?: () => void
  endReachedThreshold?: number
  getItemKey?: (item: T, index: number) => string | number
}

export function VirtualScroller<T>({
  items,
  renderItem,
  itemHeight,
  className,
  overscan = 3,
  scrollingDelay = 150,
  onEndReached,
  endReachedThreshold = 500,
  getItemKey = (_, index) => index,
}: Props<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastEndReachedRef = useRef(false)

  // Calculate item heights
  const getItemHeight = useCallback(
    (item: T, index: number) => {
      return typeof itemHeight === 'function'
        ? itemHeight(item, index)
        : itemHeight
    },
    [itemHeight],
  )

  // Calculate total content height
  const totalHeight = items.reduce(
    (total, item, index) => total + getItemHeight(item, index),
    0,
  )

  // Determine which items to render
  const getVisibleItems = useCallback(() => {
    if (!items.length) return { items: [], startIndex: 0, endIndex: 0 }

    let startIndex = 0
    let endIndex = 0
    let currentOffset = 0

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(items[i], i)
      if (currentOffset + height > scrollTop - overscan * height) {
        startIndex = i
        break
      }
      currentOffset += height
    }

    // Find end index
    currentOffset = 0
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(items[i], i)
      currentOffset += height
      if (currentOffset > scrollTop + containerHeight + overscan * height) {
        endIndex = i
        break
      }
    }

    // If we didn't find an end index, use the last item
    if (endIndex === 0) {
      endIndex = items.length - 1
    }

    return {
      items: items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex,
    }
  }, [items, scrollTop, containerHeight, overscan, getItemHeight])

  // Calculate offsets for each item
  const getItemOffsets = useCallback(() => {
    const offsets: number[] = [0]
    let currentOffset = 0

    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(items[i], i)
      currentOffset += height
      offsets.push(currentOffset)
    }

    return offsets
  }, [items, getItemHeight])

  const itemOffsets = getItemOffsets()
  const { items: visibleItems, startIndex } = getVisibleItems()

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const { scrollTop, clientHeight, scrollHeight } = containerRef.current
    setScrollTop(scrollTop)
    setContainerHeight(clientHeight)

    // Handle scroll end detection
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current)
    }

    scrollTimerRef.current = setTimeout(() => {
      // This is where we would use isScrolling if needed
    }, scrollingDelay)

    // Check if we're near the end to trigger onEndReached
    const isNearEnd =
      scrollHeight - scrollTop - clientHeight < endReachedThreshold
    if (isNearEnd && onEndReached && !lastEndReachedRef.current) {
      lastEndReachedRef.current = true
      onEndReached()
    } else if (!isNearEnd) {
      lastEndReachedRef.current = false
    }
  }, [scrollingDelay, endReachedThreshold, onEndReached])

  // Initialize container height and add scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setContainerHeight(container.clientHeight)
    container.addEventListener('scroll', handleScroll)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
      }
    }
  }, [handleScroll])

  return (
    <div
      ref={containerRef}
      className={cn('overflow-y-auto h-full', className)}
      style={{ position: 'relative' }}
    >
      <div style={{ height: totalHeight }}>
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index
          const key = getItemKey(item, actualIndex)
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: itemOffsets[actualIndex],
                left: 0,
                right: 0,
                height: getItemHeight(item, actualIndex),
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
