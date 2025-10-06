import { type PerformanceRank } from '@/types/api'

export const performanceColorMap: Record<PerformanceRank, string> = {
  1: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', // Perfect - Green
  2: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200', // Great - Light Green
  3: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', // Playable - Yellow Green
  4: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', // Poor - Orange
  5: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', // Ingame - Red Orange
  6: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100', // Intro - Red
  7: 'bg-red-300 text-red-900 dark:bg-red-700 dark:text-red-100', // Loadable - Dark Red
  8: 'bg-red-400 text-red-900 dark:bg-red-600 dark:text-red-100', // Nothing - Darkest Red
}

export const defaultPerformanceColor =
  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
