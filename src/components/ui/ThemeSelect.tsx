'use client'

import useMounted from '@/hooks/useMounted'
import { useTheme } from 'next-themes'
import themes from '@/data/themes'

interface Props {
  className?: string
}

function ThemeSelect(props: Props) {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted || !theme) return null

  return (
    <div className={`flex items-center space-x-2 ${props.className ?? ''}`}>
      <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
        {themes.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`p-1.5 transition-colors ${
                theme === option.value
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

export default ThemeSelect
