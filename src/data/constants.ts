import { ms } from '@/utils/time'

// Polling intervals in milliseconds
export const POLLING_INTERVALS = {
  NOTIFICATIONS: ms.minutes(3),
  DEFAULT: ms.seconds(30),
} as const

// Pagination limits
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  ADMIN_TABLE_LIMIT: 20,
  LARGE_BATCH_SIZE: 50,
} as const

// Cache durations in milliseconds
export const CACHE_DURATIONS = {
  SHORT: ms.minutes(1),
  MEDIUM: ms.minutes(5),
  LONG: ms.minutes(15),
  EXTRA_LONG: ms.hours(1),
} as const

// Rate limiting
export const RATE_LIMITS = {
  REQUESTS_PER_WINDOW: 100,
  WINDOW_SIZE_MS: ms.minutes(1),
} as const

// UI constants
export const UI_CONSTANTS = {
  MODAL_MAX_HEIGHT: '90vh',
  TOAST_DURATION: 5000, // 5 seconds
  DEBOUNCE_DELAY: 300, // 300ms
  ANIMATION_DURATION: 200, // 200ms
} as const

// Character limits
export const CHAR_LIMITS = {
  GAME_TITLE: 100,
  COMMENT: 2000,
  DESCRIPTION: 500,
  URL: 2000,
} as const
