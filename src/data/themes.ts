import type { ComponentType } from 'react'
import { Sun, Moon, SunMoon } from 'lucide-react'

export type ThemeValue = 'system' | 'light' | 'dark'

export type ThemeOption = {
  value: ThemeValue
  icon: ComponentType<{ className?: string }>
  label: string
  colorClass: string
}

const themes: ThemeOption[] = [
  {
    value: 'system',
    icon: SunMoon,
    label: 'System',
    colorClass: 'text-gray-500 dark:text-gray-400',
  },
  {
    value: 'light',
    icon: Sun,
    label: 'Light',
    colorClass: 'text-yellow-500',
  },
  {
    value: 'dark',
    icon: Moon,
    label: 'Dark',
    colorClass: 'text-blue-400',
  },
] as const

export default themes
