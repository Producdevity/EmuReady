import {
  GRAPHICS_DRIVER_MAPPING,
  DX_WRAPPER_MAPPING,
  STARTUP_SELECTION_MAPPING,
  BOX64_PRESET_MAPPING,
  FEXCORE_PRESET_MAPPING,
} from '@/server/utils/emulator-config/gamenative/gamenative.defaults'

function createReverseLookup<T extends Record<string, string | number | boolean>>(
  mapping: T,
): Record<string, string> {
  const reverse: Record<string, string> = {}
  for (const [customValue, configValue] of Object.entries(mapping)) {
    const key = String(configValue)
    if (!(key in reverse)) {
      reverse[key] = customValue
    }
  }
  return reverse
}

const GRAPHICS_DRIVER_REVERSE = createReverseLookup(GRAPHICS_DRIVER_MAPPING)
const DX_WRAPPER_REVERSE = createReverseLookup(DX_WRAPPER_MAPPING)
const STARTUP_SELECTION_REVERSE = createReverseLookup(STARTUP_SELECTION_MAPPING)

export interface GameNativeFieldMapping {
  jsonPath: string | string[]
  fromConfig?: (rawValue: unknown, fullConfig?: Record<string, unknown>) => unknown
}

/**
 * Parse a value from a comma-separated key=value config string
 */
export function parseConfigString(configStr: string, key: string): string | undefined {
  if (!configStr) return undefined
  for (const part of configStr.split(',')) {
    const eqIndex = part.indexOf('=')
    if (eqIndex === -1) continue
    const k = part.slice(0, eqIndex).trim()
    const v = part.slice(eqIndex + 1).trim()
    if (k === key) return v
  }
  return undefined
}

export const GAMENATIVE_IMPORT_MAPPINGS: Record<string, GameNativeFieldMapping> = {
  resolution: {
    jsonPath: 'screenSize',
  },

  env_variables: {
    jsonPath: 'envVars',
  },

  graphics_driver: {
    jsonPath: 'graphicsDriver',
    fromConfig: (value) => GRAPHICS_DRIVER_REVERSE[String(value)] ?? String(value),
  },

  dx_wrapper: {
    jsonPath: 'dxwrapper',
    fromConfig: (value) => DX_WRAPPER_REVERSE[String(value)] ?? String(value),
  },

  dx_wrapper_config: {
    jsonPath: 'dxwrapperConfig',
  },

  dxvk_version: {
    jsonPath: ['dxwrapperConfig', 'dxvkVersion'],
    fromConfig: (value, fullConfig) => {
      const configStr = String(value || '')
      const fromConfigStr = parseConfigString(configStr, 'version')
      if (fromConfigStr) return fromConfigStr
      // Fallback: check top-level dxvkVersion for old configs
      if (fullConfig && typeof fullConfig['dxvkVersion'] === 'string') {
        return fullConfig['dxvkVersion']
      }
      return configStr.includes('=') ? undefined : configStr || undefined
    },
  },

  audio_driver: {
    jsonPath: 'audioDriver',
    fromConfig: (value) => {
      const str = String(value)
      if (str === 'pulseaudio' || str === 'pulse') return 'pulse'
      if (str === 'alsa') return 'alsa'
      return str
    },
  },

  exec_arguments: {
    jsonPath: 'execArgs',
  },

  startup_selection: {
    jsonPath: 'startupSelection',
    fromConfig: (value) => STARTUP_SELECTION_REVERSE[String(value)] ?? String(value),
  },

  box64_version: {
    jsonPath: 'box64Version',
  },

  box64_preset: {
    jsonPath: 'box64Preset',
    fromConfig: (value) => {
      const upper = String(value)
      // Reverse: uppercase → lowercase for custom field
      const reversed = createReverseLookup(BOX64_PRESET_MAPPING)
      return reversed[upper] ?? upper.toLowerCase()
    },
  },

  container_variant: {
    jsonPath: 'containerVariant',
  },

  wine_version: {
    jsonPath: 'wineVersion',
  },

  steam_type: {
    jsonPath: 'steamType',
    fromConfig: (value) => {
      const str = String(value)
      if (str === 'ultralight') return 'ultra_light'
      return str
    },
  },

  dynamic_driver_version: {
    jsonPath: 'graphicsDriverVersion',
  },

  max_device_memory: {
    jsonPath: ['graphicsDriverConfig', 'dxwrapperConfig'],
    fromConfig: (value) => {
      const configStr = String(value || '')
      return parseConfigString(configStr, 'maxDeviceMemory')
    },
  },

  use_adrenotools_turnip: {
    jsonPath: 'graphicsDriverConfig',
    fromConfig: (value) => {
      const configStr = String(value || '')
      return parseConfigString(configStr, 'adrenotoolsTurnip') === '1'
    },
  },

  fex_core_version: {
    jsonPath: 'fexcoreVersion',
  },

  '32_bit_emulator': {
    jsonPath: 'emulator',
    fromConfig: (value) => {
      const str = String(value)
      if (str === 'FEXCore') return 'fex'
      if (str === 'Box64') return 'box'
      return str
    },
  },

  '64_bit_emulator': {
    jsonPath: 'emulator',
    fromConfig: (value) => {
      const str = String(value)
      if (str === 'FEXCore') return 'fex'
      if (str === 'Box64') return 'box'
      return str
    },
  },

  fex_core_preset: {
    jsonPath: 'fexcorePreset',
    fromConfig: (value) => {
      const upper = String(value)
      const reversed = createReverseLookup(FEXCORE_PRESET_MAPPING)
      return reversed[upper] ?? upper.toLowerCase()
    },
  },

  use_steam_input: {
    jsonPath: 'useSteamInput',
  },

  enable_x_input_api: {
    jsonPath: 'enableXInput',
  },

  enable_direct_input_api: {
    jsonPath: 'enableDInput',
  },

  direct_input_mapper_type: {
    jsonPath: 'dinputMapperType',
    fromConfig: (value) => {
      const num = Number(value)
      if (num === 1) return 'standard'
      if (num === 2) return 'xinput_mapper'
      return String(value)
    },
  },
}
