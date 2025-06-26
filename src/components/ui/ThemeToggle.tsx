'use client'

import { useTheme } from 'next-themes'
import { useCallback } from 'react'
import themes, { type ThemeValue, type ThemeOption } from '@/data/themes'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'

function getNextTheme(current: ThemeValue): ThemeOption {
  const index = themes.findIndex((t) => t.value === current)
  return themes[(index + 1) % themes.length]
}

interface Props {
  className?: string
}

export function ThemeToggle(props: Props) {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  const currentTheme = themes.find((t) => t.value === theme) ?? themes[0]
  const Icon = currentTheme.icon

  const handleToggle = useCallback(() => {
    setTheme(getNextTheme(currentTheme.value).value)
  }, [currentTheme.value, setTheme])

  if (!mounted || !theme) return null

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'p-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ',
        props.className,
      )}
      title={`Current theme: ${currentTheme.label}. Click to change.`}
      aria-label={`Current theme: ${currentTheme.label}. Click to change.`}
    >
      <Icon className={`w-5 h-5 ${currentTheme.colorClass}`} />
    </button>
  )
}
