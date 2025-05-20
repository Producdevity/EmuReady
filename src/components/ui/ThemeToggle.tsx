'use client'

import { useEffect, useState, type ComponentType } from 'react'
import { useTheme } from 'next-themes'
import {
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline'

type ThemeValue = 'system' | 'light' | 'dark'

type ThemeOption = {
  value: ThemeValue
  icon: ComponentType<{ className?: string }>
  label: string
  colorClass: string
}

const themes: ThemeOption[] = [
  {
    value: 'system',
    icon: ComputerDesktopIcon,
    label: 'System',
    colorClass: 'text-gray-500 dark:text-gray-400',
  },
  {
    value: 'light',
    icon: SunIcon,
    label: 'Light',
    colorClass: 'text-yellow-500',
  },
  {
    value: 'dark',
    icon: MoonIcon,
    label: 'Dark',
    colorClass: 'text-blue-400',
  },
]

const getNextTheme = (current: ThemeValue): ThemeOption => {
  const index = themes.findIndex((t) => t.value === current)
  return themes[(index + 1) % themes.length]
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !theme) return null

  const current = themes.find(({ value }) => value === theme) ?? themes[0]
  const Icon = current.icon

  const handleToggle = () => {
    const next = getNextTheme(current.value)
    setTheme(next.value)
  }

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      title={`Current theme: ${current.label}. Click to change.`}
      aria-label={`Current theme: ${current.label}`}
    >
      <Icon className={`w-5 h-5 ${current.colorClass}`} />
    </button>
  )
}

export function ThemeSelect({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !theme) return null

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Theme:
      </span>
      <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
        {themes.map((option) => {
          const Icon = option.icon
          const isActive = theme === option.value
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`p-1.5 transition-colors ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={`Use ${option.label} theme`}
              aria-label={`Use ${option.label} theme`}
            >
              <Icon className="w-4 h-4" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ThemeToggle
