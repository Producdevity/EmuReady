'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline'

const toggleThemeMap = { light: 'dark', dark: 'light', system: 'dark' }

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Wait for component to be mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const toggleTheme = () => {
    // TODO: handle "system" correctly
    const newTheme = theme
      ? toggleThemeMap[theme as keyof typeof toggleThemeMap]
      : toggleThemeMap.system
    setTheme(newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      aria-label={`Current theme: ${theme}. Click to toggle theme.`}
    >
      {theme === 'light' ? (
        <SunIcon className="w-5 h-5 text-yellow-500" />
      ) : theme === 'dark' ? (
        <MoonIcon className="w-5 h-5 text-blue-400" />
      ) : (
        <ComputerDesktopIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      )}
    </button>
  )
}

export function ThemeSelect({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Theme:
      </span>
      <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
        <button
          onClick={() => setTheme('light')}
          className={`p-1.5 ${
            theme === 'light'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          aria-label="Use light theme"
        >
          <SunIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`p-1.5 ${
            theme === 'dark'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          aria-label="Use dark theme"
        >
          <MoonIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`p-1.5 ${
            theme === 'system'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          aria-label="Use system theme"
        >
          <ComputerDesktopIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
