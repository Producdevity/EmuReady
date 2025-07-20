// Polling intervals in milliseconds
export const POLLING_INTERVALS = {
  NOTIFICATIONS: 3 * 60 * 1000, // 3 minutes
  DEFAULT: 30 * 1000, // 30 seconds
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
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  EXTRA_LONG: 60 * 60 * 1000, // 1 hour
} as const

// Rate limiting
export const RATE_LIMITS = {
  REQUESTS_PER_WINDOW: 100,
  WINDOW_SIZE_MS: 60 * 1000, // 1 minute
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
