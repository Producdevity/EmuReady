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

// Cache durations in milliseconds TODO: use wherever possible
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

// Game submission limits
// Users can only add this many more games than they have listings (listings + pc-listings)
// This encourages users to contribute compatibility reports rather than just adding games
// AUTHOR role and above are exempt from this limit
export const GAME_SUBMISSION_LIMITS = {
  // Buffer: how many more games a user can add compared to their total listings
  // e.g., with buffer=5: user with 3 listings can have up to 8 games
  BUFFER: 5,
} as const

export const API_KEY_LIMITS = {
  DEFAULT_MONTHLY: 10_000,
  DEFAULT_WEEKLY: 2_500,
  DEFAULT_BURST_PER_MINUTE: 100,
  USAGE_SERIES_LIMIT: 30,
} as const

// UI constants
export const UI_CONSTANTS = {
  MODAL_MAX_HEIGHT: '90vh',
  TOAST_DURATION: ms.seconds(5),
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
} as const

// Home page display limits
export const HOME_PAGE_LIMITS = {
  TRENDING_DEVICES: 6,
  TOP_CONTRIBUTORS: 3,
} as const

// Character limits
export const CHAR_LIMITS = {
  GAME_TITLE: 100,
  COMMENT: 2000,
  DESCRIPTION: 500,
  NOTES: 1000,
  BAN_NOTES: 500,
  URL: 2000,
} as const

export type PlatformKey =
  | 'microsoft_windows'
  | 'microsoft_xbox'
  | 'microsoft_xbox_360'
  | 'microsoft_xbox_one'
  | 'microsoft_xbox_series_x'
  | 'nintendo_3ds'
  | 'nintendo_ds'
  | 'nintendo_gamecube'
  | 'nintendo_gb'
  | 'nintendo_gba'
  | 'nintendo_gbc'
  | 'nintendo_n64'
  | 'nintendo_nes'
  | 'nintendo_snes'
  | 'nintendo_switch'
  | 'nintendo_wii'
  | 'nintendo_wii_u'
  | 'sega_dreamcast'
  | 'sega_gamegear'
  | 'sega_genesis'
  | 'sega_saturn'
  | 'sony_playstation'
  | 'sony_playstation_2'
  | 'sony_playstation_3'
  | 'sony_playstation_4'
  | 'sony_playstation_5'
  | 'sony_playstation_portable'
  | 'sony_playstation_vita'

export type PlatformMappings = Record<'tgdb' | 'igdb' | 'rawg', Record<PlatformKey, number | null>>

export const PLATFORM_MAPPINGS: PlatformMappings = {
  tgdb: {
    microsoft_windows: 1,
    microsoft_xbox: 14,
    microsoft_xbox_360: 15,
    microsoft_xbox_one: 4920,
    microsoft_xbox_series_x: 4981,
    nintendo_3ds: 4912,
    nintendo_ds: 8,
    nintendo_gamecube: 2,
    nintendo_gb: 4,
    nintendo_gba: 5,
    nintendo_gbc: 41,
    nintendo_n64: 3,
    nintendo_nes: 7,
    nintendo_snes: 6,
    nintendo_switch: 4971,
    nintendo_wii: 9,
    nintendo_wii_u: 38,
    sega_dreamcast: 16,
    sega_gamegear: 20,
    sega_genesis: 36,
    sega_saturn: 17,
    sony_playstation: 10,
    sony_playstation_2: 11,
    sony_playstation_3: 12,
    sony_playstation_4: 4919,
    sony_playstation_5: 4980,
    sony_playstation_portable: 13,
    sony_playstation_vita: 39,
  },
  igdb: {
    microsoft_windows: 6,
    microsoft_xbox: 11,
    microsoft_xbox_360: 12,
    microsoft_xbox_one: 49,
    microsoft_xbox_series_x: 169,
    nintendo_3ds: 37,
    nintendo_ds: 20,
    nintendo_gamecube: 21,
    nintendo_gb: 33,
    nintendo_gba: 24,
    nintendo_gbc: 22,
    nintendo_n64: 4,
    nintendo_nes: 18,
    nintendo_snes: 19,
    nintendo_switch: 130,
    nintendo_wii: 5,
    nintendo_wii_u: 41,
    sega_dreamcast: 23,
    sega_gamegear: 35,
    sega_genesis: 29,
    sega_saturn: 32,
    sony_playstation: 7,
    sony_playstation_2: 8,
    sony_playstation_3: 9,
    sony_playstation_4: 48,
    sony_playstation_5: 167,
    sony_playstation_portable: 38,
    sony_playstation_vita: 46,
  },
  rawg: {
    microsoft_windows: 4,
    microsoft_xbox: 80,
    microsoft_xbox_360: 14,
    microsoft_xbox_one: 1,
    microsoft_xbox_series_x: 186,
    nintendo_3ds: 8,
    nintendo_ds: 9,
    nintendo_gamecube: 105,
    nintendo_gb: 26,
    nintendo_gba: 24,
    nintendo_gbc: 43,
    nintendo_n64: 83,
    nintendo_nes: 49,
    nintendo_snes: 79,
    nintendo_switch: 7,
    nintendo_wii: 11,
    nintendo_wii_u: 10,
    sega_dreamcast: null,
    sega_gamegear: null,
    sega_genesis: null,
    sega_saturn: null,
    sony_playstation: 27,
    sony_playstation_2: 15,
    sony_playstation_3: 16,
    sony_playstation_4: 18,
    sony_playstation_5: 187,
    sony_playstation_portable: 17,
    sony_playstation_vita: 19,
  },
}
