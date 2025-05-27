import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType } from 'react'

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
] as const

export default themes
