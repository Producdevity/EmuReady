/**
 * Eden Configuration Defaults
 *
 * Centralized default values for Eden emulator configurations
 * to avoid hardcoding values throughout transform functions
 */

import type {
  CpuBackend,
  CpuAccuracy,
  GpuBackend,
  GpuAccuracy,
  ResolutionSetup,
  ScalingFilter,
  AntiAliasing,
  VSyncMode,
  AstcRecompression,
  NvdecEmulation,
  VramUsageMode,
  AudioOutputEngine,
  DynamicState,
  OptimizeSpirvOutput,
  MaxAnisotropy,
} from '../types/eden'

// Default CPU settings
export const DEFAULT_CPU_BACKEND: CpuBackend = 0 // Dynarmic
export const DEFAULT_CPU_ACCURACY: CpuAccuracy = 0 // Auto

// Default GPU settings
export const DEFAULT_GPU_BACKEND: GpuBackend = 1 // Vulkan
export const DEFAULT_GPU_ACCURACY: GpuAccuracy = 0 // Normal

// Default resolution (native 1x)
export const DEFAULT_RESOLUTION_SETUP: ResolutionSetup = 2

// Default rendering settings
export const DEFAULT_SCALING_FILTER: ScalingFilter = 1 // Bilinear
export const DEFAULT_ANTI_ALIASING: AntiAliasing = 0 // None
export const DEFAULT_MAX_ANISOTROPY: MaxAnisotropy = 0 // Auto

// Default VSync mode
export const DEFAULT_VSYNC_MODE: VSyncMode = 2 // FIFO (On)

// Default compression settings
export const DEFAULT_ASTC_RECOMPRESSION: AstcRecompression = 2 // BC3 (Medium Quality)

// Default video decoding
export const DEFAULT_NVDEC_EMULATION: NvdecEmulation = 1 // CPU

// Default VRAM usage
export const DEFAULT_VRAM_USAGE_MODE: VramUsageMode = 0 // Conservative

// Default audio engine
export const DEFAULT_AUDIO_OUTPUT_ENGINE: AudioOutputEngine = 0 // Auto

// Default dynamic state
export const DEFAULT_DYNAMIC_STATE: DynamicState = 0 // Disabled

// Default SPIR-V optimization
export const DEFAULT_OPTIMIZE_SPIRV_OUTPUT: OptimizeSpirvOutput = 1 // On Load

// Default screen resolution for Eden resolution parsing
export const DEFAULT_SCREEN_RESOLUTION = '854x480'

// Mapping objects for user-friendly values to Eden internal values
export const CPU_BACKEND_MAPPING: Record<string, CpuBackend> = {
  'Native code execution (NCE)': 1, // NCE
  'Dynamic (Slow)': 0, // Dynarmic
  Dynarmic: 0,
  NCE: 1,
  Software: 2,
}

export const CPU_ACCURACY_MAPPING: Record<string, CpuAccuracy> = {
  Auto: 0,
  Accurate: 1,
  Unsafe: 2,
  'Paranoid (Slow)': 1, // Map to Accurate
}

export const GPU_BACKEND_MAPPING: Record<string, GpuBackend> = {
  Vulkan: 1, // Vulkan
  OpenGL: 0, // OpenGL
  Other: 3, // Null
}

export const GPU_ACCURACY_MAPPING: Record<string, GpuAccuracy> = {
  Normal: 0,
  High: 1,
  'Extreme (Slow)': 2,
}

export const ANTI_ALIASING_MAPPING: Record<string, AntiAliasing> = {
  None: 0,
  FXAA: 1,
  SMAA: 2, // SMAA Low
  Other: 0,
}

export const MAX_ANISOTROPY_MAPPING: Record<string, MaxAnisotropy> = {
  Auto: 0,
  Default: 0,
  '2x': 1,
  '4x': 2,
  '8x': 3,
  '16x': 4,
}

export const VSYNC_MODE_MAPPING: Record<string, VSyncMode> = {
  'Immediate (Off)': 0,
  Mailbox: 1,
  'FIFO (On)': 2,
  'FIFO Relaxed': 3,
}

export const ASTC_RECOMPRESSION_MAPPING: Record<string, AstcRecompression> = {
  Uncompressed: 0,
  'BC1 (Low Quality)': 1,
  'BC3 (Medium Quality)': 2,
}

export const NVDEC_EMULATION_MAPPING: Record<string, NvdecEmulation> = {
  None: 0, // No Video Output
  CPU: 1, // CPU Video Decoding
  GPU: 2, // GPU Video Decoding
}

export const VRAM_USAGE_MODE_MAPPING: Record<string, VramUsageMode> = {
  Conservative: 0,
  Aggressive: 1,
  Extreme: 2,
  Balanced: 1, // Map to Aggressive
}

export const DYNAMIC_STATE_MAPPING: Record<string, DynamicState> = {
  Disabled: 0,
  'Dynamic State 1': 1,
  'Dynamic State 2': 2,
  'Dynamic State 3 (All)': 3,
}

export const SCALING_FILTER_MAPPING: Record<string, ScalingFilter> = {
  'Nearest Neighbor': 0,
  Bilinear: 1, // Default
  Bicubic: 2,
  Gaussian: 3,
  ScaleForce: 4,
  'AMD FidelityFX - Super Resolution': 5, // FSR
  NVIDIA: 6, // FXAA
  Other: 1,
}

export const OPTIMIZE_SPIRV_OUTPUT_MAPPING: Record<
  string,
  OptimizeSpirvOutput
> = {
  Never: 0,
  'On Load': 1,
  Always: 2,
}

export const AUDIO_OUTPUT_ENGINE_MAPPING: Record<string, AudioOutputEngine> = {
  Auto: 0,
  Cubeb: 1,
  SDL2: 2,
  Null: 3,
}

// Resolution multiplier mapping for Eden resolution setup
export const RESOLUTION_MULTIPLIER_MAPPING: Record<string, ResolutionSetup> = {
  '0.5x': 0,
  '0.75x': 1,
  '1x': 2,
  native: 2,
  '1.0x': 2,
  '1.5x': 3,
  '2x': 4,
  '3x': 5,
  '4x': 6,
  '5x': 7,
  '6x': 8,
  '7x': 9,
  '8x': 10,
}

// Values that indicate no custom GPU driver should be used
export const NO_DRIVER_VALUES = [
  'N/A',
  'n/a',
  'Default System Driver',
  'Default',
  '',
  'Xclipse Stock',
  'Default Driver',
  'System Default',
]

// Common driver names for path construction
export const COMMON_DRIVER_NAMES = ['turnip', 'freedreno', 'mesa', 'qualcomm']

// Helper functions for validation and defaults
export const EdenDefaults = {
  // CPU defaults
  getDefaultCpuBackend: (): CpuBackend => DEFAULT_CPU_BACKEND,
  getDefaultCpuAccuracy: (): CpuAccuracy => DEFAULT_CPU_ACCURACY,

  // GPU defaults
  getDefaultGpuBackend: (): GpuBackend => DEFAULT_GPU_BACKEND,
  getDefaultGpuAccuracy: (): GpuAccuracy => DEFAULT_GPU_ACCURACY,

  // Resolution defaults
  getDefaultResolutionSetup: (): ResolutionSetup => DEFAULT_RESOLUTION_SETUP,
  getDefaultScalingFilter: (): ScalingFilter => DEFAULT_SCALING_FILTER,

  // Rendering defaults
  getDefaultAntiAliasing: (): AntiAliasing => DEFAULT_ANTI_ALIASING,
  getDefaultMaxAnisotropy: (): MaxAnisotropy => DEFAULT_MAX_ANISOTROPY,
  getDefaultVsyncMode: (): VSyncMode => DEFAULT_VSYNC_MODE,

  // Compression/decoding defaults
  getDefaultAstcRecompression: (): AstcRecompression =>
    DEFAULT_ASTC_RECOMPRESSION,
  getDefaultNvdecEmulation: (): NvdecEmulation => DEFAULT_NVDEC_EMULATION,

  // Memory/performance defaults
  getDefaultVramUsageMode: (): VramUsageMode => DEFAULT_VRAM_USAGE_MODE,
  getDefaultDynamicState: (): DynamicState => DEFAULT_DYNAMIC_STATE,
  getDefaultOptimizeSpirvOutput: (): OptimizeSpirvOutput =>
    DEFAULT_OPTIMIZE_SPIRV_OUTPUT,

  // Audio defaults
  getDefaultAudioOutputEngine: (): AudioOutputEngine =>
    DEFAULT_AUDIO_OUTPUT_ENGINE,

  // Validation functions
  isNoDriverValue: (value: string): boolean => NO_DRIVER_VALUES.includes(value),
  isCommonDriverName: (value: string): boolean => {
    const lowerValue = value.toLowerCase()
    return COMMON_DRIVER_NAMES.some((driver) => lowerValue.includes(driver))
  },

  // Resolution parsing helpers
  parseResolutionMultiplier: (value: string): ResolutionSetup | null => {
    const resStr = value.trim().toLowerCase()

    // Direct mapping lookup
    if (RESOLUTION_MULTIPLIER_MAPPING[resStr] !== undefined) {
      return RESOLUTION_MULTIPLIER_MAPPING[resStr]
    }

    // Pattern matching for multipliers like "2.5x"
    const multiplierMatch = resStr.match(/^(\d+(?:\.\d+)?)\s*x(?:\s|$|\()/i)
    if (multiplierMatch) {
      const multiplier = parseFloat(multiplierMatch[1])
      // Find closest match
      if (multiplier <= 0.5) return 0
      if (multiplier <= 0.75) return 1
      if (multiplier <= 1.25) return 2
      if (multiplier <= 1.75) return 3
      if (multiplier <= 2.5) return 4
      if (multiplier <= 3.5) return 5
      if (multiplier <= 4.5) return 6
      if (multiplier <= 5.5) return 7
      if (multiplier <= 6.5) return 8
      if (multiplier <= 7.5) return 9
      return 10 as ResolutionSetup
    }

    return null
  },

  isPixelResolution: (value: string): boolean => {
    const resStr = value.trim().toLowerCase()
    return !!resStr.match(/\d+x\d+/) || !!resStr.match(/\d+p/)
  },
}
