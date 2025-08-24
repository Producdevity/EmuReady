/**
 * @fileoverview System to Platform ID Mapping Utilities
 *
 * This module provides functions to map EmuReady gaming system records to external
 * game database platform IDs (IGDB, TGDB, RAWG). It supports both direct key-based
 * mapping and fallback name-based matching for legacy compatibility.
 *
 * The mapping system uses PLATFORM_MAPPINGS constants which define the relationship
 * between EmuReady system keys and external platform IDs. New systems should be
 * added to both the system seeder and PLATFORM_MAPPINGS constants.
 *
 * @see {@link PLATFORM_MAPPINGS} for the complete mapping configuration
 * @see {@link src/prisma/seeders/systemsSeeder.ts} for system database records
 */

import { PLATFORM_MAPPINGS, type PlatformKey } from '@/data/constants'

/**
 * Maps a system name to a platform key used in PLATFORM_MAPPINGS.
 *
 * This function performs string matching on system display names to determine
 * the appropriate platform key for use with external game databases. It handles
 * various naming conventions and aliases for gaming platforms.
 *
 * @param systemName - The display name of the gaming system/platform
 * @returns The corresponding platform key from PlatformKey enum, or null if no match
 *
 * @example
 * systemNameToPlatformKey('Nintendo Switch') // Returns: 'nintendo_switch'
 * systemNameToPlatformKey('PlayStation 5') // Returns: 'sony_playstation_5'
 * systemNameToPlatformKey('Windows') // Returns: 'microsoft_windows'
 * systemNameToPlatformKey('Unknown System') // Returns: null
 *
 * @internal This function is primarily used as a fallback when system.key is not available
 */
export function systemNameToPlatformKey(systemName: string): PlatformKey | null {
  const normalized = systemName.toLowerCase().trim()

  // Microsoft Windows/PC
  if (normalized.includes('windows') || normalized.includes('pc') || normalized === 'win') {
    return 'microsoft_windows'
  }

  // Microsoft Xbox
  if (
    normalized.includes('xbox series') ||
    normalized.includes('series x') ||
    normalized.includes('series s')
  ) {
    return 'microsoft_xbox_series_x'
  }
  if (normalized.includes('xbox one')) {
    return 'microsoft_xbox_one'
  }
  if (normalized.includes('xbox 360')) {
    return 'microsoft_xbox_360'
  }
  if (normalized === 'xbox' || normalized.includes('original xbox')) {
    return 'microsoft_xbox'
  }

  // Nintendo
  if (normalized.includes('switch')) {
    return 'nintendo_switch'
  }
  if (normalized.includes('wii u') || normalized.includes('wiiu')) {
    return 'nintendo_wii_u'
  }
  if (normalized === 'wii' || normalized.includes('nintendo wii')) {
    return 'nintendo_wii'
  }
  if (normalized.includes('3ds') || normalized.includes('nintendo 3ds')) {
    return 'nintendo_3ds'
  }
  if (normalized.includes('nintendo ds') || normalized === 'nds' || normalized === 'ds') {
    return 'nintendo_ds'
  }
  if (normalized.includes('gamecube') || normalized === 'gcn' || normalized === 'ngc') {
    return 'nintendo_gamecube'
  }
  if (normalized.includes('nintendo 64') || normalized === 'n64') {
    return 'nintendo_n64'
  }
  if (
    normalized.includes('super nintendo') ||
    normalized === 'snes' ||
    normalized.includes('super famicom')
  ) {
    return 'nintendo_snes'
  }
  if (
    normalized.includes('nintendo entertainment') ||
    normalized === 'nes' ||
    normalized.includes('famicom')
  ) {
    return 'nintendo_nes'
  }
  if (normalized.includes('game boy advance') || normalized === 'gba') {
    return 'nintendo_gba'
  }
  if (normalized.includes('game boy color') || normalized === 'gbc') {
    return 'nintendo_gbc'
  }
  if (normalized.includes('game boy') || normalized === 'gb' || normalized === 'gameboy') {
    return 'nintendo_gb'
  }

  // Sony PlayStation
  if (normalized.includes('playstation 5') || normalized.includes('ps5')) {
    return 'sony_playstation_5'
  }
  if (normalized.includes('playstation 4') || normalized.includes('ps4')) {
    return 'sony_playstation_4'
  }
  if (normalized.includes('playstation 3') || normalized.includes('ps3')) {
    return 'sony_playstation_3'
  }
  if (normalized.includes('playstation 2') || normalized.includes('ps2')) {
    return 'sony_playstation_2'
  }
  if (
    normalized.includes('playstation vita') ||
    normalized.includes('ps vita') ||
    normalized.includes('psvita')
  ) {
    return 'sony_playstation_vita'
  }
  if (normalized.includes('psp') || normalized.includes('playstation portable')) {
    return 'sony_playstation_portable'
  }
  if (
    normalized === 'playstation' ||
    normalized === 'ps1' ||
    normalized === 'psx' ||
    normalized === 'psone'
  ) {
    return 'sony_playstation'
  }

  // Sega
  if (normalized.includes('dreamcast')) {
    return 'sega_dreamcast'
  }
  if (normalized.includes('saturn')) {
    return 'sega_saturn'
  }
  if (normalized.includes('genesis') || normalized.includes('mega drive')) {
    return 'sega_genesis'
  }
  if (normalized.includes('game gear') || normalized === 'gg') {
    return 'sega_gamegear'
  }

  return null
}

/**
 * Gets the IGDB platform ID for a given system.
 *
 * This function maps EmuReady system records to IGDB (Internet Game Database) platform IDs
 * for use in game search and metadata operations. It prioritizes the system's `key` field
 * which directly matches PLATFORM_MAPPINGS constants, then falls back to name matching.
 *
 * @param systemOrName - Either a system object with optional key field, or system name string
 * @param systemOrName.key - Optional platform key that directly maps to PLATFORM_MAPPINGS
 * @param systemOrName.name - System display name used for fallback mapping
 * @returns The IGDB platform ID number, or null if no mapping exists
 *
 * @example
 * // Using system object with key (preferred)
 * const system = { key: 'nintendo_switch', name: 'Nintendo Switch' }
 * const platformId = getIGDBPlatformId(system) // Returns: 130
 *
 * @example
 * // Using system name string (fallback)
 * const platformId = getIGDBPlatformId('Nintendo Switch') // Returns: 130
 *
 * @example
 * // System with no mapping
 * const platformId = getIGDBPlatformId('Unknown System') // Returns: null
 */
export function getIGDBPlatformId(
  systemOrName: string | { key?: string | null; name: string },
): number | null {
  // If it's a system object with a key, use that directly
  if (typeof systemOrName === 'object' && systemOrName.key) {
    const platformKey = systemOrName.key as PlatformKey
    return PLATFORM_MAPPINGS.igdb[platformKey] ?? null
  }

  // Otherwise, use name mapping as fallback
  const systemName = typeof systemOrName === 'string' ? systemOrName : systemOrName.name
  const platformKey = systemNameToPlatformKey(systemName)
  if (!platformKey) return null

  return PLATFORM_MAPPINGS.igdb[platformKey] ?? null
}

/**
 * Gets the TGDB platform ID for a given system.
 *
 * This function maps EmuReady system records to TGDB (TheGamesDB) platform IDs
 * for use in game metadata retrieval and image fetching operations. It prioritizes
 * the system's `key` field which directly matches PLATFORM_MAPPINGS constants,
 * then falls back to name matching for legacy compatibility.
 *
 * @param systemOrName - Either a system object with optional key field, or system name string
 * @param systemOrName.key - Optional platform key that directly maps to PLATFORM_MAPPINGS
 * @param systemOrName.name - System display name used for fallback mapping
 * @returns The TGDB platform ID number, or null if no mapping exists
 *
 * @example
 * // Using system object with key (preferred)
 * const system = { key: 'sony_playstation_5', name: 'Sony PlayStation 5' }
 * const platformId = getTGDBPlatformId(system) // Returns: 4980
 *
 * @example
 * // Using system name string (fallback)
 * const platformId = getTGDBPlatformId('Sony PlayStation 5') // Returns: 4980
 */
export function getTGDBPlatformId(
  systemOrName: string | { key?: string | null; name: string },
): number | null {
  // If it's a system object with a key, use that directly
  if (typeof systemOrName === 'object' && systemOrName.key) {
    const platformKey = systemOrName.key as PlatformKey
    return PLATFORM_MAPPINGS.tgdb[platformKey] ?? null
  }

  // Otherwise, use name mapping as fallback
  const systemName = typeof systemOrName === 'string' ? systemOrName : systemOrName.name
  const platformKey = systemNameToPlatformKey(systemName)
  if (!platformKey) return null

  return PLATFORM_MAPPINGS.tgdb[platformKey] ?? null
}

/**
 * Gets the RAWG platform ID for a given system.
 *
 * This function maps EmuReady system records to RAWG (rawg.io) platform IDs
 * for use in game data retrieval and discovery operations. Note that RAWG
 * has limited platform support compared to IGDB and TGDB, with some platforms
 * returning null values in PLATFORM_MAPPINGS.
 *
 * @param systemOrName - Either a system object with optional key field, or system name string
 * @param systemOrName.key - Optional platform key that directly maps to PLATFORM_MAPPINGS
 * @param systemOrName.name - System display name used for fallback mapping
 * @returns The RAWG platform ID number, or null if no mapping exists
 *
 * @example
 * // Using system object with key (preferred)
 * const system = { key: 'microsoft_windows', name: 'Microsoft Windows' }
 * const platformId = getRAWGPlatformId(system) // Returns: 4
 *
 * @example
 * // Platform not supported by RAWG
 * const system = { key: 'sega_dreamcast', name: 'Sega Dreamcast' }
 * const platformId = getRAWGPlatformId(system) // Returns: null
 */
export function getRAWGPlatformId(
  systemOrName: string | { key?: string | null; name: string },
): number | null {
  // If it's a system object with a key, use that directly
  if (typeof systemOrName === 'object' && systemOrName.key) {
    const platformKey = systemOrName.key as PlatformKey
    return PLATFORM_MAPPINGS.rawg[platformKey] ?? null
  }

  // Otherwise, use name mapping as fallback
  const systemName = typeof systemOrName === 'string' ? systemOrName : systemOrName.name
  const platformKey = systemNameToPlatformKey(systemName)
  if (!platformKey) return null

  return PLATFORM_MAPPINGS.rawg[platformKey] ?? null
}
