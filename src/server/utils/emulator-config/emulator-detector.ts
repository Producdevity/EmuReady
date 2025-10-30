/**
 * Emulator Detection and Config Generator Selection
 *
 * Maps emulator names from the database to appropriate configuration generators
 */

import { convertToAzaharConfig, serializeAzaharConfig } from './azahar/azahar.converter'
import { EMULATOR_CONFIG_TYPES, ConfigTypeUtils, type EmulatorConfigType } from './constants'
import { convertToEdenConfig, serializeEdenConfig } from './eden/eden.converter'
import {
  convertToGameNativeConfig,
  serializeGameNativeConfig,
} from './gamenative/gamenative.converter'
import type { Prisma } from '@orm'

export interface EmulatorConfigResult {
  type: EmulatorConfigType
  config: unknown
  serialized: string
  filename: string
}

/**
 * Mapping of emulator names to config generators
 * Only supported emulators are included - unsupported emulators will throw errors
 */
const EMULATOR_CONFIG_MAPPING: Record<string, EmulatorConfigType> = {
  Azahar: EMULATOR_CONFIG_TYPES.AZAHAR,
  Eden: EMULATOR_CONFIG_TYPES.EDEN,
  GameNative: EMULATOR_CONFIG_TYPES.GAMENATIVE,

  // APS3E: EMULATOR_CONFIG_TYPES.APS3E,
  // AetherSX2: EMULATOR_CONFIG_TYPES.AETHER_SX2,
  // Cemu: EMULATOR_CONFIG_TYPES.CEMU,
  // Citron: EMULATOR_CONFIG_TYPES.CITRON,
  // Cxbx: EMULATOR_CONFIG_TYPES.CXBX_RELOADED,
  // Dolphin: EMULATOR_CONFIG_TYPES.DOLPHIN,
  // DraStic: EMULATOR_CONFIG_TYPES.DRASTIC,
  // DuckStation: EMULATOR_CONFIG_TYPES.DUCKSTATION,
  // ExaGear: EMULATOR_CONFIG_TYPES.EXAGEAR,
  // Flycast: EMULATOR_CONFIG_TYPES.FLYCAST,
  // GameHub: EMULATOR_CONFIG_TYPES.GAMEHUB,
  // Horizon: EMULATOR_CONFIG_TYPES.HORIZON,
  // Lemuroid: EMULATOR_CONFIG_TYPES.LEMUROID,
  // Lime3DS: EMULATOR_CONFIG_TYPES.LIME3DS,
  // Lutris: EMULATOR_CONFIG_TYPES.LUTRIS,
  // MeloNX: EMULATOR_CONFIG_TYPES.MELONX,
  // MiceWine: EMULATOR_CONFIG_TYPES.MICEWINE,
  // Mobox: EMULATOR_CONFIG_TYPES.MOBOX,
  // NethersX2: EMULATOR_CONFIG_TYPES.NETHERSX2,
  // PCSX2: EMULATOR_CONFIG_TYPES.PCSX2,
  // PPSSPP: EMULATOR_CONFIG_TYPES.PPSSPP,
  // Pluvia: EMULATOR_CONFIG_TYPES.PLUVIA,
  // RPCS3: EMULATOR_CONFIG_TYPES.RPCS3,
  // RPCSX: EMULATOR_CONFIG_TYPES.RPCSX,
  // Redream: EMULATOR_CONFIG_TYPES.REDREAM,
  // RetroArch: EMULATOR_CONFIG_TYPES.RETROARCH,
  // Ryujinx: EMULATOR_CONFIG_TYPES.RYUJINX,
  // ShadPS4: EMULATOR_CONFIG_TYPES.SHADPS4,
  // Skyline: EMULATOR_CONFIG_TYPES.SKYLINE,
  // Sudachi: EMULATOR_CONFIG_TYPES.SUDACHI,
  // Torzu: EMULATOR_CONFIG_TYPES.TORZU,
  // UTM: EMULATOR_CONFIG_TYPES.UTM,
  // Vita3K: EMULATOR_CONFIG_TYPES.VITA3K,
  // Winlator: EMULATOR_CONFIG_TYPES.WINLATOR,
  // XBSX2: EMULATOR_CONFIG_TYPES.XBSX2,
  // Xemu: EMULATOR_CONFIG_TYPES.XEMU,
  // Xenia: EMULATOR_CONFIG_TYPES.XENIA,
  // Yaba: EMULATOR_CONFIG_TYPES.YABA,
  // Yuzu: EMULATOR_CONFIG_TYPES.YUZU,
  // melonDS: EMULATOR_CONFIG_TYPES.MELONDS,
}

/**
 * Detect which config generator to use based on emulator name
 * Throws error if emulator is not supported
 */
export function detectEmulatorConfigType(emulatorName: string): EmulatorConfigType {
  const configType = EMULATOR_CONFIG_MAPPING[emulatorName]
  if (configType) return configType

  // Fallback: try case-insensitive matching
  const lowerEmulatorName = emulatorName.toLowerCase()
  for (const [name, type] of Object.entries(EMULATOR_CONFIG_MAPPING)) {
    if (name.toLowerCase() === lowerEmulatorName) return type
  }

  // If no match found, throw error
  const supportedEmulators = Object.keys(EMULATOR_CONFIG_MAPPING).join(', ')
  throw new Error(
    `Config generation not supported for emulator: ${emulatorName}. ` +
      `Supported emulators: ${supportedEmulators}`,
  )
}

interface EmulatorConfigInput {
  listingId: string
  gameId: string
  emulatorName: string
  packageName?: string | null
  customFieldValues: {
    customFieldDefinition: {
      name: string
      label: string
      type: string
      options?: Prisma.JsonValue | null
    }
    value: Prisma.JsonValue
  }[]
  configTypeOverride?: EmulatorConfigType
}
/**
 * Generate configuration for a listing based on its emulator
 */
export function generateEmulatorConfig(input: EmulatorConfigInput): EmulatorConfigResult {
  const configType = input.configTypeOverride ?? detectEmulatorConfigType(input.emulatorName)

  switch (configType) {
    case EMULATOR_CONFIG_TYPES.EDEN: {
      const config = convertToEdenConfig({
        listingId: input.listingId,
        gameId: input.gameId,
        packageName: input.packageName,
        customFieldValues: input.customFieldValues,
      })

      const serialized = serializeEdenConfig(config)
      const extension = ConfigTypeUtils.getFileExtension(EMULATOR_CONFIG_TYPES.EDEN)
      const filename = `${input.emulatorName.toLowerCase()}-${input.listingId}${extension}`

      return {
        type: EMULATOR_CONFIG_TYPES.EDEN,
        config,
        serialized,
        filename,
      }
    }

    case EMULATOR_CONFIG_TYPES.AZAHAR: {
      const config = convertToAzaharConfig({
        listingId: input.listingId,
        gameId: input.gameId,
        customFieldValues: input.customFieldValues,
      })

      const serialized = serializeAzaharConfig(config)
      const extension = ConfigTypeUtils.getFileExtension(EMULATOR_CONFIG_TYPES.AZAHAR)
      const filename = `${input.emulatorName.toLowerCase()}-${input.listingId}${extension}`

      return {
        type: EMULATOR_CONFIG_TYPES.AZAHAR,
        config,
        serialized,
        filename,
      }
    }

    case EMULATOR_CONFIG_TYPES.GAMENATIVE: {
      const config = convertToGameNativeConfig({
        listingId: input.listingId,
        gameId: input.gameId,
        customFieldValues: input.customFieldValues,
      })

      const serialized = serializeGameNativeConfig(config)
      const extension = ConfigTypeUtils.getFileExtension(EMULATOR_CONFIG_TYPES.GAMENATIVE)
      const filename = `${input.emulatorName.toLowerCase()}-${input.listingId}${extension}`

      return {
        type: EMULATOR_CONFIG_TYPES.GAMENATIVE,
        config,
        serialized,
        filename,
      }
    }

    default: {
      // This should never happen since detectEmulatorConfigType throws for unsupported emulators
      throw new Error(`Unexpected config type for emulator: ${input.emulatorName}`)
    }
  }
}

/**
 * Get list of supported emulators for config generation
 */
export function getSupportedEmulators(): {
  azahar: string[]
  eden: string[]
  gamenative: string[]
} {
  const azahar: string[] = []
  const eden: string[] = []
  const gamenative: string[] = []

  for (const [name, type] of Object.entries(EMULATOR_CONFIG_MAPPING)) {
    switch (type) {
      case 'azahar':
        azahar.push(name)
        break
      case 'eden':
        eden.push(name)
        break
      case 'gamenative':
        gamenative.push(name)
        break
    }
  }

  return { azahar, eden, gamenative }
}

/**
 * Check if an emulator supports config generation
 */
export function isConfigGenerationSupported(emulatorName: string): boolean {
  try {
    const configType = detectEmulatorConfigType(emulatorName)
    // Double-check that the config type is valid
    return ConfigTypeUtils.isValidConfigType(configType)
  } catch {
    return false
  }
}

/**
 * Get file extension for emulator config type
 */
export function getConfigFileExtension(configType: EmulatorConfigType): string {
  // Validate the config type first
  if (!ConfigTypeUtils.isValidConfigType(configType)) {
    throw new Error(`Unknown config type: ${configType}`)
  }
  // Use the centralized helper function
  return ConfigTypeUtils.getFileExtension(configType)
}

/**
 * Get display name for emulator config type
 */
export function getConfigDisplayName(configType: EmulatorConfigType): string {
  return ConfigTypeUtils.getDisplayName(configType)
}
