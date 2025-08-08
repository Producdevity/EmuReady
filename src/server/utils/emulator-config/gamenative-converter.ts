/**
 * GameNative Emulator Configuration Converter
 * Converts listing data with custom field values to GameNative JSON format
 */

import {
  GameNativeDefaults,
  DX_WRAPPER_MAPPING,
  AUDIO_DRIVER_MAPPING,
  STARTUP_SELECTION_MAPPING,
  BOX64_PRESET_MAPPING,
  BOX86_PRESET_MAPPING,
} from './defaults/gamenative'
import { DEFAULT_CONFIG } from './types/gamenative'
import type {
  ContainerConfig,
  ScreenSize,
  GraphicsDriver,
  DxWrapper,
  AudioDriver,
  StartupSelection,
  Box86Version,
  Box64Version,
  Box86_64Preset,
} from './types/gamenative'
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

// Export the properly typed config
export type GameNativeConfig = Required<ContainerConfig>

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
  // Resolution mapping
  resolution: {
    key: 'screenSize',
    transform: (value): ScreenSize => {
      const resStr = String(value)
      // Extract resolution from formats like "1920x1080 (16:9)" or just "1920x1080"
      const match = resStr.match(/(\d+x\d+)/)
      return match ? match[1] : GameNativeDefaults.getDefaultScreenSize()
    },
  },

  // Environment variables - complex string needs special handling
  env_variables: {
    key: 'envVars',
    transform: (value) => {
      // If empty or not provided, use default environment variables
      if (!value || String(value).trim() === '') {
        return GameNativeDefaults.getDefaultEnvVars()
      }
      return String(value).trim()
    },
  },

  // Graphics driver - handles both new SELECT values and legacy TEXT values
  graphics_driver: {
    key: 'graphicsDriver',
    transform: (value): GraphicsDriver => {
      return GameNativeDefaults.detectGraphicsDriver(String(value))
    },
    defaultIfEmpty: GameNativeDefaults.getDefaultGraphicsDriver(),
  },

  // DX Wrapper
  dx_wrapper: {
    key: 'dxwrapper',
    transform: (value): DxWrapper => {
      return (
        DX_WRAPPER_MAPPING[String(value)] ??
        GameNativeDefaults.getDefaultDxWrapper()
      )
    },
  },

  // DX Wrapper Config
  dx_wrapper_config: {
    key: 'dxwrapperConfig',
    transform: (value) => String(value || ''),
    defaultIfEmpty: '',
  },

  // Audio driver
  audio_driver: {
    key: 'audioDriver',
    transform: (value): AudioDriver => {
      return (
        AUDIO_DRIVER_MAPPING[String(value)] ??
        GameNativeDefaults.getDefaultAudioDriver()
      )
    },
  },

  // Execution arguments
  exec_arguments: {
    key: 'execArgs',
    transform: (value) => String(value || ''),
    defaultIfEmpty: '',
  },

  // Startup selection
  startup_selection: {
    key: 'startupSelection',
    transform: (value): StartupSelection => {
      return (
        STARTUP_SELECTION_MAPPING[String(value)] ??
        GameNativeDefaults.getDefaultStartupSelection()
      )
    },
  },

  // Box64 version
  box64_version: {
    key: 'box64Version',
    transform: (value): Box64Version => {
      const v = String(value || GameNativeDefaults.getDefaultBox64Version())
      // Validate against known versions using centralized validation
      return GameNativeDefaults.isValidBox64Version(v)
        ? (v as Box64Version)
        : GameNativeDefaults.getDefaultBox64Version()
    },
    defaultIfEmpty: GameNativeDefaults.getDefaultBox64Version(),
  },

  // Box86 version (not in example but in target config)
  box86_version: {
    key: 'box86Version',
    transform: (value): Box86Version => {
      const v = String(value || GameNativeDefaults.getDefaultBox86Version())
      // Validate against known versions using centralized validation
      return GameNativeDefaults.isValidBox86Version(v)
        ? (v as Box86Version)
        : GameNativeDefaults.getDefaultBox86Version()
    },
    defaultIfEmpty: GameNativeDefaults.getDefaultBox86Version(),
  },

  // Box64 preset
  box64_preset: {
    key: 'box64Preset',
    transform: (value): Box86_64Preset => {
      return (
        BOX64_PRESET_MAPPING[String(value)] ??
        GameNativeDefaults.getDefaultBoxPreset()
      )
    },
  },

  // Box86 preset (not in example but needed)
  box86_preset: {
    key: 'box86Preset',
    transform: (value): Box86_64Preset => {
      return (
        BOX86_PRESET_MAPPING[String(value)] ??
        GameNativeDefaults.getDefaultBoxPreset()
      )
    },
  },

  // Windows Components - Critical missing field
  // Convert individual boolean fields to wincomponents string
  use_native_direct3d: { key: 'wincomponents', transform: () => undefined }, // Handled specially
  use_native_directsound: { key: 'wincomponents', transform: () => undefined }, // Handled specially
  use_native_directmusic: { key: 'wincomponents', transform: () => undefined }, // Handled specially
  use_native_directshow: { key: 'wincomponents', transform: () => undefined }, // Handled specially
  use_native_directplay: { key: 'wincomponents', transform: () => undefined }, // Handled specially
  use_native_vcrun2010: { key: 'wincomponents', transform: () => undefined }, // Handled specially
  use_native_wmdecoder: { key: 'wincomponents', transform: () => undefined }, // Handled specially

  // Video Memory Size
  video_memory_size: {
    key: 'videoMemorySize',
    transform: (value) => {
      const sizeStr = String(
        value || GameNativeDefaults.getDefaultVideoMemorySize(),
      )
      // Validate against known sizes using centralized validation
      return GameNativeDefaults.isValidVideoMemorySize(sizeStr)
        ? sizeStr
        : GameNativeDefaults.getDefaultVideoMemorySize()
    },
    defaultIfEmpty: GameNativeDefaults.getDefaultVideoMemorySize(),
  },

  // CPU Core Affinity
  cpu_list: {
    key: 'cpuList',
    transform: (value) =>
      String(value || GameNativeDefaults.getDefaultCpuList()),
    defaultIfEmpty: GameNativeDefaults.getDefaultCpuList(),
  },

  cpu_list_wow64: {
    key: 'cpuListWoW64',
    transform: (value) =>
      String(value || GameNativeDefaults.getDefaultCpuList()),
    defaultIfEmpty: GameNativeDefaults.getDefaultCpuList(),
  },

  // WoW64 Mode
  wow64_mode: {
    key: 'wow64Mode',
    transform: (value) => Boolean(value ?? true),
    defaultIfEmpty: true,
  },

  // Show FPS Overlay
  show_fps: {
    key: 'showFPS',
    transform: (value) => Boolean(value ?? false),
    defaultIfEmpty: false,
  },

  // Input/Controller Settings
  sdl_controller_api: {
    key: 'sdlControllerAPI',
    transform: (value) => Boolean(value ?? true),
    defaultIfEmpty: true,
  },

  enable_xinput: {
    key: 'enableXInput',
    transform: (value) => Boolean(value ?? true),
    defaultIfEmpty: true,
  },

  enable_dinput: {
    key: 'enableDInput',
    transform: (value) => Boolean(value ?? true),
    defaultIfEmpty: true,
  },

  dinput_mapper_type: {
    key: 'dinputMapperType',
    transform: (value) => {
      const num = Number(value)
      // 0: Standard, 1: XInput
      return num === 0 || num === 1 ? num : 1
    },
    defaultIfEmpty: 1,
  },

  disable_mouse_input: {
    key: 'disableMouseInput',
    transform: (value) => Boolean(value ?? false),
    defaultIfEmpty: false,
  },

  // Graphics/Rendering Settings
  csmt: {
    key: 'csmt',
    transform: (value) => Boolean(value ?? true),
    defaultIfEmpty: true,
  },

  video_pci_device_id: {
    key: 'videoPciDeviceID',
    transform: (value) => {
      const num = Number(value)
      return isNaN(num) ? GameNativeDefaults.getDefaultVideoPciDeviceId() : num
    },
    defaultIfEmpty: GameNativeDefaults.getDefaultVideoPciDeviceId(),
  },

  offscreen_rendering_mode: {
    key: 'offScreenRenderingMode',
    transform: (value) => {
      const mode = String(
        value || GameNativeDefaults.getDefaultOffscreenRenderingMode(),
      ).toLowerCase()
      return GameNativeDefaults.isValidOffscreenRenderingMode(mode)
        ? mode
        : GameNativeDefaults.getDefaultOffscreenRenderingMode()
    },
    defaultIfEmpty: GameNativeDefaults.getDefaultOffscreenRenderingMode(),
  },

  strict_shader_math: {
    key: 'strictShaderMath',
    transform: (value) => Boolean(value ?? true),
    defaultIfEmpty: true,
  },

  mouse_warp_override: {
    key: 'mouseWarpOverride',
    transform: (value) => {
      const mode = String(
        value || GameNativeDefaults.getDefaultMouseWarpOverride(),
      ).toLowerCase()
      return GameNativeDefaults.isValidMouseWarpOverride(mode)
        ? mode
        : GameNativeDefaults.getDefaultMouseWarpOverride()
    },
    defaultIfEmpty: GameNativeDefaults.getDefaultMouseWarpOverride(),
  },

  shader_backend: {
    key: 'shaderBackend',
    transform: (value) =>
      String(value || GameNativeDefaults.getDefaultShaderBackend()),
    defaultIfEmpty: GameNativeDefaults.getDefaultShaderBackend(),
  },

  use_glsl: {
    key: 'useGLSL',
    transform: (value) => {
      const val = String(value || GameNativeDefaults.getDefaultUseGlsl())
      return GameNativeDefaults.isValidUseGlsl(val)
        ? val
        : GameNativeDefaults.getDefaultUseGlsl()
    },
    defaultIfEmpty: GameNativeDefaults.getDefaultUseGlsl(),
  },

  // Graphics Driver Version - dynamic field
  graphics_driver_version: {
    key: 'graphicsDriverVersion',
    transform: (value) => String(value || ''),
    defaultIfEmpty: '',
  },
}

/**
 * Get default GameNative configuration
 */
function getDefaultConfig(): GameNativeConfig {
  // Use the typed default config from the types file
  return { ...DEFAULT_CONFIG }
}

/**
 * Convert listing data to GameNative configuration
 */
export function convertToGameNativeConfig(
  input: GameNativeConfigInput,
): GameNativeConfig {
  const config = getDefaultConfig()

  // Process each custom field value
  for (const fieldValue of input.customFieldValues) {
    const fieldName = fieldValue.customFieldDefinition.name
    const mapping = FIELD_MAPPINGS[fieldName]

    if (mapping) {
      const value = fieldValue.value

      // Skip if empty and no defaultIfEmpty is specified
      if (
        (value === '' || value === null || value === undefined) &&
        !mapping.defaultIfEmpty
      ) {
        continue
      }

      // Use defaultIfEmpty if value is empty
      const actualValue =
        value === '' || value === null || value === undefined
          ? mapping.defaultIfEmpty
          : value

      // Transform and assign value
      const transformedValue = mapping.transform
        ? mapping.transform(actualValue)
        : actualValue

      // Skip Windows Components fields - they're handled specially below
      if (mapping.key === 'wincomponents') {
        continue
      }

      // Assign value to the correct key
      // We need to use Object.assign or explicit property access
      Object.assign(config, { [mapping.key]: transformedValue })
    }
  }

  // Special handling for Windows Components - combine multiple boolean fields
  const winComponentFields = {
    use_native_direct3d: 'direct3d',
    use_native_directsound: 'directsound',
    use_native_directmusic: 'directmusic',
    use_native_directshow: 'directshow',
    use_native_directplay: 'directplay',
    use_native_vcrun2010: 'vcrun2010',
    use_native_wmdecoder: 'wmdecoder',
  }

  const winComponentsMap = new Map<string, boolean>()

  // Set defaults using centralized configuration
  for (const [component, value] of Object.entries(
    GameNativeDefaults.getDefaultWindowsComponents(),
  )) {
    winComponentsMap.set(component, value)
  }

  // Override with user values if present
  for (const fieldValue of input.customFieldValues) {
    const fieldName = fieldValue.customFieldDefinition.name
    const componentName =
      winComponentFields[fieldName as keyof typeof winComponentFields]

    if (componentName) {
      winComponentsMap.set(componentName, Boolean(fieldValue.value))
    }
  }

  // Build wincomponents string
  const winComponentsParts: string[] = []
  for (const [component, useNative] of winComponentsMap) {
    winComponentsParts.push(`${component}=${useNative ? '1' : '0'}`)
  }
  config.wincomponents = winComponentsParts.join(',')

  return config
}

/**
 * Serialize GameNative configuration to JSON format
 */
export function serializeGameNativeConfig(config: GameNativeConfig): string {
  return JSON.stringify(config, null, 2)
}

/**
 * Get fields that are missing from custom fields but important for GameNative
 */
export function getMissingImportantFields(): string[] {
  return [
    // Critical for compatibility
    'wincomponents - Windows components config (direct3d, directsound, etc.)',
    'wow64Mode - WoW64 mode for 32-bit apps (default: true)',
    'box86_version - Box86 version (default: 0.3.2)',
    'box86_preset - Box86 preset (default: COMPATIBILITY)',

    // Performance impacting
    'videoMemorySize - Video memory in MB (default: 2048)',
    'csmt - Command stream multi-threading (default: true)',
    'cpuList - CPU core affinity (default: 0-7)',

    // Input/Controller
    'sdlControllerAPI - SDL controller support (default: true)',
    'enableXInput - XInput support (default: true)',
    'enableDInput - DirectInput support (default: true)',
    'dinputMapperType - DirectInput mapper (default: 1 for XInput)',

    // Graphics/Rendering
    'videoPciDeviceID - Emulated GPU ID (default: 1728 - GTX 480)',
    'offScreenRenderingMode - Rendering mode (default: fbo)',
    'strictShaderMath - Shader math precision (default: true)',
    'mouseWarpOverride - Mouse warp behavior (default: disable)',

    // User Experience
    'showFPS - FPS overlay (default: false)',
    'desktopTheme - Wine desktop theme (default: LIGHT,IMAGE,#0277bd)',
  ]
}
