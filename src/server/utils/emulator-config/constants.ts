/**
 * Emulator Configuration Constants
 *
 * Centralized constants for emulator configuration types and their properties
 * to avoid magic strings and provide proper TypeScript support
 */

// Emulator config type constants
export const EMULATOR_CONFIG_TYPES = {
  AZAHAR: 'azahar',
  EDEN: 'eden',
  GAMENATIVE: 'gamenative',
} as const

// Union type for emulator config types
export type EmulatorConfigType = (typeof EMULATOR_CONFIG_TYPES)[keyof typeof EMULATOR_CONFIG_TYPES]

// File extensions for each config type
export const CONFIG_FILE_EXTENSIONS: Record<EmulatorConfigType, string> = {
  [EMULATOR_CONFIG_TYPES.AZAHAR]: '.ini',
  [EMULATOR_CONFIG_TYPES.EDEN]: '.ini',
  [EMULATOR_CONFIG_TYPES.GAMENATIVE]: '.json',
} as const

// MIME types for each config type
export const CONFIG_MIME_TYPES: Record<EmulatorConfigType, string> = {
  [EMULATOR_CONFIG_TYPES.AZAHAR]: 'text/plain',
  [EMULATOR_CONFIG_TYPES.EDEN]: 'text/plain',
  [EMULATOR_CONFIG_TYPES.GAMENATIVE]: 'application/json',
} as const

// Syntax highlighting languages for each config type
export const CONFIG_SYNTAX_LANGUAGES: Record<EmulatorConfigType, string> = {
  [EMULATOR_CONFIG_TYPES.AZAHAR]: 'ini',
  [EMULATOR_CONFIG_TYPES.EDEN]: 'ini',
  [EMULATOR_CONFIG_TYPES.GAMENATIVE]: 'json',
} as const

// Display names for each config type
export const CONFIG_TYPE_DISPLAY_NAMES: Record<EmulatorConfigType, string> = {
  [EMULATOR_CONFIG_TYPES.AZAHAR]: 'Azahar Configuration',
  [EMULATOR_CONFIG_TYPES.EDEN]: 'Eden Configuration',
  [EMULATOR_CONFIG_TYPES.GAMENATIVE]: 'GameNative Configuration',
} as const

// Utility functions for config type operations
export const ConfigTypeUtils = {
  isValidConfigType(type: string): type is EmulatorConfigType {
    return Object.values(EMULATOR_CONFIG_TYPES).includes(type as EmulatorConfigType)
  },

  getFileExtension(type: EmulatorConfigType): string {
    return CONFIG_FILE_EXTENSIONS[type]
  },

  getMimeType(type: EmulatorConfigType): string {
    return CONFIG_MIME_TYPES[type]
  },

  getSyntaxLanguage(type: EmulatorConfigType): string {
    return CONFIG_SYNTAX_LANGUAGES[type]
  },

  getDisplayName(type: EmulatorConfigType): string {
    return CONFIG_TYPE_DISPLAY_NAMES[type]
  },
} as const
