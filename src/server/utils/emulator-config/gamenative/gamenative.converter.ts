/**
 * GameNative Emulator Configuration Converter
 * Converts listing data with custom field values to GameNative JSON format
 */

import {
  DEFAULT_CONFIG,
  GameNativeDefaults,
  DX_WRAPPER_MAPPING,
  AUDIO_DRIVER_MAPPING,
  STARTUP_SELECTION_MAPPING,
  BOX64_PRESET_MAPPING,
  EMULATOR_MAPPING,
  CONTAINER_VARIANT_MAPPING,
  STEAM_TYPE_MAPPING,
  FEXCORE_PRESET_MAPPING,
} from './gamenative.defaults'
import type {
  ContainerConfig,
  ScreenSize,
  GraphicsDriver,
  DxWrapper,
  AudioDriver,
  StartupSelection,
  Box64Version,
  Box86_64Preset,
  ContainerVariant,
  SteamType,
  FEXCorePreset,
  DinputMapperType,
} from './gamenative.types'
import type { Prisma } from '@orm'

export interface CustomFieldValue {
  customFieldDefinition: {
    name: string
    label: string
    type: string
    options?: Prisma.JsonValue | null
  }
  value: Prisma.JsonValue
}

export interface GameNativeConfigInput {
  listingId: string
  gameId: string
  customFieldValues: CustomFieldValue[]
}

export type GameNativeConfig = Required<ContainerConfig>

/**
 * Appends a key=value pair to a comma-separated config string
 */
function appendToConfigString(existing: string, key: string, value: string): string {
  if (!existing) return `${key}=${value}`
  return `${existing},${key}=${value}`
}

/**
 * Maps custom field names to GameNative config keys and transforms values
 */
const FIELD_MAPPINGS: Record<
  string,
  {
    key: keyof GameNativeConfig
    transform?: (value: unknown) => unknown
    defaultIfEmpty?: unknown
  }
> = {
  resolution: {
    key: 'screenSize',
    transform: (value): ScreenSize => {
      const resStr = String(value)
      const match = resStr.match(/(\d+x\d+)/)
      return match ? match[1] : GameNativeDefaults.getDefaultScreenSize()
    },
  },

  env_variables: {
    key: 'envVars',
    transform: (value) => {
      return !value || String(value).trim() === ''
        ? GameNativeDefaults.getDefaultEnvVars()
        : String(value).trim()
    },
  },

  graphics_driver: {
    key: 'graphicsDriver',
    transform: (value): GraphicsDriver => GameNativeDefaults.detectGraphicsDriver(String(value)),
    defaultIfEmpty: GameNativeDefaults.getDefaultGraphicsDriver(),
  },

  dx_wrapper: {
    key: 'dxwrapper',
    transform: (value): DxWrapper =>
      DX_WRAPPER_MAPPING[String(value)] ?? GameNativeDefaults.getDefaultDxWrapper(),
  },

  dx_wrapper_config: {
    key: 'dxwrapperConfig',
    transform: (value) => String(value || ''),
    defaultIfEmpty: '',
  },

  audio_driver: {
    key: 'audioDriver',
    transform: (value): AudioDriver =>
      AUDIO_DRIVER_MAPPING[String(value)] ?? GameNativeDefaults.getDefaultAudioDriver(),
  },

  exec_arguments: {
    key: 'execArgs',
    transform: (value) => String(value || ''),
    defaultIfEmpty: '',
  },

  startup_selection: {
    key: 'startupSelection',
    transform: (value): StartupSelection =>
      STARTUP_SELECTION_MAPPING[String(value)] ?? GameNativeDefaults.getDefaultStartupSelection(),
  },

  box64_version: {
    key: 'box64Version',
    transform: (value): Box64Version => {
      const version = String(value || GameNativeDefaults.getDefaultBox64Version()).trim()
      if (GameNativeDefaults.isValidBox64Version(version)) return version
      return GameNativeDefaults.getDefaultBox64Version()
    },
    defaultIfEmpty: GameNativeDefaults.getDefaultBox64Version(),
  },

  box64_preset: {
    key: 'box64Preset',
    transform: (value): Box86_64Preset =>
      BOX64_PRESET_MAPPING[String(value)] ?? GameNativeDefaults.getDefaultBoxPreset(),
  },

  container_variant: {
    key: 'containerVariant',
    transform: (value): ContainerVariant =>
      CONTAINER_VARIANT_MAPPING[String(value)] ?? GameNativeDefaults.getDefaultContainerVariant(),
  },

  wine_version: {
    key: 'wineVersion',
    transform: (value) => String(value || ''),
    defaultIfEmpty: '',
  },

  steam_type: {
    key: 'steamType',
    transform: (value): SteamType =>
      STEAM_TYPE_MAPPING[String(value)] ?? GameNativeDefaults.getDefaultSteamType(),
  },

  dynamic_driver_version: {
    key: 'graphicsDriverVersion',
    transform: (value) => String(value || ''),
    defaultIfEmpty: '',
  },

  fex_core_version: {
    key: 'fexcoreVersion',
    transform: (value) => String(value || ''),
    defaultIfEmpty: '',
  },

  fex_core_preset: {
    key: 'fexcorePreset',
    transform: (value): FEXCorePreset =>
      FEXCORE_PRESET_MAPPING[String(value)] ?? GameNativeDefaults.getDefaultFexcorePreset(),
  },

  use_steam_input: {
    key: 'useSteamInput',
    transform: (value) => Boolean(value ?? false),
    defaultIfEmpty: false,
  },

  enable_x_input_api: {
    key: 'enableXInput',
    transform: (value) => Boolean(value ?? true),
    defaultIfEmpty: true,
  },

  enable_direct_input_api: {
    key: 'enableDInput',
    transform: (value) => Boolean(value ?? true),
    defaultIfEmpty: true,
  },

  direct_input_mapper_type: {
    key: 'dinputMapperType',
    transform: (value): DinputMapperType => {
      const str = String(value)
      if (str === 'xinput_mapper') return 2
      if (str === 'standard') return 1
      const num = Number(value)
      if (num === 2) return 2
      return 1
    },
    defaultIfEmpty: 1,
  },
}

function getDefaultConfig(): GameNativeConfig {
  return { ...DEFAULT_CONFIG }
}

/**
 * Convert listing data to GameNative configuration
 */
export function convertToGameNativeConfig(input: GameNativeConfigInput): GameNativeConfig {
  const config = getDefaultConfig()

  const fieldValuesByName = new Map<string, unknown>()
  for (const fieldValue of input.customFieldValues) {
    fieldValuesByName.set(fieldValue.customFieldDefinition.name, fieldValue.value)
  }

  for (const fieldValue of input.customFieldValues) {
    const fieldName = fieldValue.customFieldDefinition.name
    const mapping = FIELD_MAPPINGS[fieldName]

    if (!mapping) continue

    const value = fieldValue.value

    if ((value === '' || value === null || value === undefined) && !mapping.defaultIfEmpty) {
      continue
    }

    const actualValue =
      value === '' || value === null || value === undefined ? mapping.defaultIfEmpty : value

    const transformedValue = mapping.transform ? mapping.transform(actualValue) : actualValue

    Object.assign(config, { [mapping.key]: transformedValue })
  }

  // Merge dxvk_version into dxwrapperConfig as version=X
  const dxvkVersion = fieldValuesByName.get('dxvk_version')
  if (dxvkVersion && String(dxvkVersion).trim()) {
    config.dxwrapperConfig = appendToConfigString(
      config.dxwrapperConfig,
      'version',
      String(dxvkVersion).trim(),
    )
  }

  // Merge max_device_memory into graphicsDriverConfig as maxDeviceMemory=N
  const maxDeviceMemory = fieldValuesByName.get('max_device_memory')
  if (maxDeviceMemory && String(maxDeviceMemory).trim()) {
    config.graphicsDriverConfig = appendToConfigString(
      config.graphicsDriverConfig,
      'maxDeviceMemory',
      String(maxDeviceMemory).trim(),
    )
  }

  // Handle 32_bit_emulator / 64_bit_emulator → emulator field
  const emulator32 = fieldValuesByName.get('32_bit_emulator')
  const emulator64 = fieldValuesByName.get('64_bit_emulator')
  const emulatorValue = emulator64 ?? emulator32
  if (emulatorValue && String(emulatorValue).trim()) {
    config.emulator =
      EMULATOR_MAPPING[String(emulatorValue)] ?? GameNativeDefaults.getDefaultEmulator()
  }

  // Handle use_adrenotools_turnip → graphicsDriverConfig.adrenotoolsTurnip
  const useAdrenotoolsTurnip = fieldValuesByName.get('use_adrenotools_turnip')
  if (useAdrenotoolsTurnip !== undefined && useAdrenotoolsTurnip !== null) {
    const isEnabled =
      useAdrenotoolsTurnip === true ||
      useAdrenotoolsTurnip === 'true' ||
      useAdrenotoolsTurnip === '1'
    config.graphicsDriverConfig = appendToConfigString(
      config.graphicsDriverConfig,
      'adrenotoolsTurnip',
      isEnabled ? '1' : '0',
    )
  }

  return config
}

/**
 * Serialize GameNative configuration to JSON format
 */
export function serializeGameNativeConfig(config: GameNativeConfig): string {
  return JSON.stringify(config, null, 2)
}
