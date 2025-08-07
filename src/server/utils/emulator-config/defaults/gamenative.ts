/**
 * GameNative Configuration Defaults
 *
 * Centralized default values for GameNative emulator configurations
 * to avoid hardcoding values throughout transform functions
 */

import type {
  GraphicsDriver,
  DxWrapper,
  AudioDriver,
  StartupSelection,
  Box86Version,
  Box64Version,
  Box86_64Preset,
  ScreenSize,
} from '../types/gamenative'

// Default environment variables for GameNative
export const DEFAULT_ENV_VARS =
  'ZINK_DESCRIPTORS=lazy ZINK_DEBUG=compact MESA_SHADER_CACHE_DISABLE=false MESA_SHADER_CACHE_MAX_SIZE=512MB mesa_glthread=true WINEESYNC=1 MESA_VK_WSI_PRESENT_MODE=mailbox TU_DEBUG=noconform'

// Default resolution for GameNative
export const DEFAULT_SCREEN_SIZE: ScreenSize = '854x480'

// Default graphics driver
export const DEFAULT_GRAPHICS_DRIVER: GraphicsDriver = 'vortek'

// Graphics driver mapping for both new SELECT values and legacy TEXT values
export const GRAPHICS_DRIVER_MAPPING: Record<string, GraphicsDriver> = {
  // New SELECT values (exact match)
  'VirGL (Universal)': 'virgl',
  'Turnip (Adreno)': 'turnip',
  'Vortek (Universal)': 'vortek',

  // Legacy TEXT values (for backward compatibility)
  virgl: 'virgl',
  turnip: 'turnip',
  vortek: 'vortek',
  VirGL: 'virgl',
  Turnip: 'turnip',
  Vortek: 'vortek',
  VIRGL: 'virgl',
  TURNIP: 'turnip',
  VORTEK: 'vortek',

  // Partial matches for legacy TEXT entries
  adreno: 'turnip', // Common legacy entry
}

// Default DX wrapper
export const DEFAULT_DX_WRAPPER: DxWrapper = 'dxvk'

// Default audio driver
export const DEFAULT_AUDIO_DRIVER: AudioDriver = 'alsa'

// Default startup selection (Essential services)
export const DEFAULT_STARTUP_SELECTION: StartupSelection = 1

// Default Box versions
export const DEFAULT_BOX64_VERSION: Box64Version = '0.3.6'
export const DEFAULT_BOX86_VERSION: Box86Version = '0.3.2'

// Default Box presets (Compatibility for best results)
export const DEFAULT_BOX_PRESET: Box86_64Preset = 'COMPATIBILITY'

// Default video memory size in MB
export const DEFAULT_VIDEO_MEMORY_SIZE = '2048'

// Default CPU affinity (all 8 cores)
export const DEFAULT_CPU_LIST = '0,1,2,3,4,5,6,7'

// Default PCI device ID (NVIDIA GeForce GTX 480)
export const DEFAULT_VIDEO_PCI_DEVICE_ID = 1728

// Default offscreen rendering mode
export const DEFAULT_OFFSCREEN_RENDERING_MODE = 'fbo'

// Default mouse warp override
export const DEFAULT_MOUSE_WARP_OVERRIDE = 'disable'

// Default shader backend
export const DEFAULT_SHADER_BACKEND = 'glsl'

// Default GLSL usage
export const DEFAULT_USE_GLSL = 'enabled'

// Valid video memory sizes (in MB)
export const VALID_VIDEO_MEMORY_SIZES = [
  '32',
  '64',
  '128',
  '256',
  '512',
  '1024',
  '2048',
  '4096',
  '6144',
  '8192',
  '10240',
  '12288',
]

// Valid offscreen rendering modes
export const VALID_OFFSCREEN_RENDERING_MODES = ['fbo', 'backbuffer']

// Valid mouse warp override modes
export const VALID_MOUSE_WARP_OVERRIDE_MODES = ['disable', 'enable', 'force']

// Valid GLSL values
export const VALID_USE_GLSL_VALUES = ['enabled', 'disabled']

// Windows Components defaults
export const DEFAULT_WINDOWS_COMPONENTS = {
  direct3d: true,
  directsound: true,
  directmusic: false,
  directshow: false,
  directplay: false,
  vcrun2010: true,
  wmdecoder: true,
}

// Mapping objects for user-friendly values to internal values
export const DX_WRAPPER_MAPPING: Record<string, DxWrapper> = {
  WineD3D: 'wined3d',
  DXVK: 'dxvk',
  VKD3D: 'vkd3d',
  'CNC DDraw': 'cnc-ddraw',
  Other: 'dxvk',
}

export const AUDIO_DRIVER_MAPPING: Record<string, AudioDriver> = {
  ALSA: 'alsa',
  PulseAudio: 'pulse', // Correct value is 'pulse' not 'pulseaudio'
  Other: 'alsa',
}

export const STARTUP_SELECTION_MAPPING: Record<string, StartupSelection> = {
  'Normal (Load all services)': 0,
  'Essential (Load only essential services)': 1,
  'Aggressive (Stop services on startup)': 2,
  Other: 1,
}

export const BOX64_PRESET_MAPPING: Record<string, Box86_64Preset> = {
  Stability: 'STABILITY',
  Compatibility: 'COMPATIBILITY',
  Intermediate: 'INTERMEDIATE',
  Performance: 'PERFORMANCE',
  'Other/Custom': 'COMPATIBILITY',
}

export const BOX86_PRESET_MAPPING: Record<string, Box86_64Preset> = {
  Stability: 'STABILITY',
  Compatibility: 'COMPATIBILITY',
  Intermediate: 'INTERMEDIATE',
  Performance: 'PERFORMANCE',
  'Other/Custom': 'COMPATIBILITY',
}

// Helper functions for validation
export const GameNativeDefaults = {
  // Environment variables
  getDefaultEnvVars: (): string => DEFAULT_ENV_VARS,

  // Screen size
  getDefaultScreenSize: (): ScreenSize => DEFAULT_SCREEN_SIZE,

  // Graphics
  getDefaultGraphicsDriver: (): GraphicsDriver => DEFAULT_GRAPHICS_DRIVER,
  getDefaultDxWrapper: (): DxWrapper => DEFAULT_DX_WRAPPER,

  // Audio
  getDefaultAudioDriver: (): AudioDriver => DEFAULT_AUDIO_DRIVER,

  // System
  getDefaultStartupSelection: (): StartupSelection => DEFAULT_STARTUP_SELECTION,
  getDefaultBox64Version: (): Box64Version => DEFAULT_BOX64_VERSION,
  getDefaultBox86Version: (): Box86Version => DEFAULT_BOX86_VERSION,
  getDefaultBoxPreset: (): Box86_64Preset => DEFAULT_BOX_PRESET,

  // Video/Graphics settings
  getDefaultVideoMemorySize: (): string => DEFAULT_VIDEO_MEMORY_SIZE,
  getDefaultCpuList: (): string => DEFAULT_CPU_LIST,
  getDefaultVideoPciDeviceId: (): number => DEFAULT_VIDEO_PCI_DEVICE_ID,
  getDefaultOffscreenRenderingMode: (): string =>
    DEFAULT_OFFSCREEN_RENDERING_MODE,
  getDefaultMouseWarpOverride: (): string => DEFAULT_MOUSE_WARP_OVERRIDE,
  getDefaultShaderBackend: (): string => DEFAULT_SHADER_BACKEND,
  getDefaultUseGlsl: (): string => DEFAULT_USE_GLSL,

  // Windows components
  getDefaultWindowsComponents: () => ({ ...DEFAULT_WINDOWS_COMPONENTS }),

  // Validation functions
  isValidVideoMemorySize: (size: string): boolean =>
    VALID_VIDEO_MEMORY_SIZES.includes(size),
  isValidOffscreenRenderingMode: (mode: string): boolean =>
    VALID_OFFSCREEN_RENDERING_MODES.includes(mode.toLowerCase()),
  isValidMouseWarpOverride: (mode: string): boolean =>
    VALID_MOUSE_WARP_OVERRIDE_MODES.includes(mode.toLowerCase()),
  isValidUseGlsl: (value: string): boolean =>
    VALID_USE_GLSL_VALUES.includes(value.toLowerCase()),
  isValidBox64Version: (version: string): boolean =>
    version === '0.3.6' || version === '0.3.4',
  isValidBox86Version: (version: string): boolean =>
    version === '0.3.2' || version === '0.3.7',

  // Graphics driver detection with smart fallback for legacy TEXT values
  detectGraphicsDriver: (value: string): GraphicsDriver => {
    if (!value || typeof value !== 'string') {
      return DEFAULT_GRAPHICS_DRIVER
    }

    const cleanValue = value.trim()

    // First try exact match for new SELECT values (these are reliable)
    if (GRAPHICS_DRIVER_MAPPING[cleanValue]) {
      return GRAPHICS_DRIVER_MAPPING[cleanValue]
    }

    // For legacy TEXT values, normalize by trimming whitespace and converting to lowercase
    const normalizedValue = cleanValue.toLowerCase()

    // Try exact match after normalization
    for (const [key, driver] of Object.entries(GRAPHICS_DRIVER_MAPPING)) {
      if (key.toLowerCase() === normalizedValue) {
        return driver
      }
    }

    // Try substring matching for legacy TEXT entries (handles messy user input)
    if (
      normalizedValue.includes('turnip') ||
      normalizedValue.includes('adreno')
    ) {
      return 'turnip'
    }
    if (normalizedValue.includes('virgl')) {
      return 'virgl'
    }
    if (normalizedValue.includes('vortek')) {
      return 'vortek'
    }

    // If we can't determine, fall back to default
    return DEFAULT_GRAPHICS_DRIVER
  },
}
