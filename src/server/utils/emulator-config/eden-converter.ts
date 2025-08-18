/**
 * Eden Emulator Configuration Converter
 * Converts listing data with custom field values to Eden .ini format
 */

import {
  EdenDefaults,
  CPU_BACKEND_MAPPING,
  CPU_ACCURACY_MAPPING,
  GPU_BACKEND_MAPPING,
  GPU_ACCURACY_MAPPING,
  ANTI_ALIASING_MAPPING,
  MAX_ANISOTROPY_MAPPING,
  VSYNC_MODE_MAPPING,
  ASTC_RECOMPRESSION_MAPPING,
  NVDEC_EMULATION_MAPPING,
  VRAM_USAGE_MODE_MAPPING,
  DYNAMIC_STATE_MAPPING,
  SCALING_FILTER_MAPPING,
  OPTIMIZE_SPIRV_OUTPUT_MAPPING,
  AUDIO_OUTPUT_ENGINE_MAPPING,
} from './defaults/eden'
import { DEFAULT_CONFIG } from './types/eden'
import type {
  EdenConfig,
  EdenConfigSection,
  BooleanConfigValue,
  IntConfigValue,
  StringConfigValue,
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
} from './types/eden'
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

export interface EdenConfigInput {
  listingId: string
  gameId: string
  customFieldValues: CustomFieldValue[]
}

/**
 * Maps custom field names to Eden .ini keys and sections
 */
const FIELD_MAPPINGS: Record<
  string,
  {
    section: EdenConfigSection
    key: string
    transform?: (value: unknown) => string | number | boolean | undefined
  }
> = {
  // CPU Section
  cpu_backend: {
    section: 'Cpu',
    key: 'cpu_backend',
    transform: (value): CpuBackend => {
      return CPU_BACKEND_MAPPING[String(value)] ?? EdenDefaults.getDefaultCpuBackend()
    },
  },
  cpu_accuracy: {
    section: 'Cpu',
    key: 'cpu_accuracy',
    transform: (value): CpuAccuracy => {
      return CPU_ACCURACY_MAPPING[String(value)] ?? EdenDefaults.getDefaultCpuAccuracy()
    },
  },
  fast_cpu_time: {
    section: 'Cpu',
    key: 'fast_cpu_time',
    transform: (value) => Boolean(value),
  },

  // Core Section
  synchronize_core_speed: {
    section: 'Core',
    key: 'sync_core_speed',
    transform: (value) => Boolean(value),
  },

  // Renderer Section
  gpu_api: {
    section: 'Renderer',
    key: 'backend',
    transform: (value): GpuBackend => {
      return GPU_BACKEND_MAPPING[String(value)] ?? EdenDefaults.getDefaultGpuBackend()
    },
  },
  disk_shader_cache: {
    section: 'Renderer',
    key: 'use_disk_shader_cache',
    transform: (value) => Boolean(value),
  },
  use_async_shaders: {
    section: 'Renderer',
    key: 'use_asynchronous_shaders',
    transform: (value) => Boolean(value),
  },
  use_reactive_flushing: {
    section: 'Renderer',
    key: 'use_reactive_flushing',
    transform: (value) => Boolean(value),
  },
  anti_aliasing_method: {
    section: 'Renderer',
    key: 'anti_aliasing',
    transform: (value): AntiAliasing => {
      return ANTI_ALIASING_MAPPING[String(value)] ?? EdenDefaults.getDefaultAntiAliasing()
    },
  },
  anisotropic_filtering: {
    section: 'Renderer',
    key: 'max_anisotropy',
    transform: (value): MaxAnisotropy => {
      return MAX_ANISOTROPY_MAPPING[String(value)] ?? EdenDefaults.getDefaultMaxAnisotropy()
    },
  },
  vsync_mode: {
    section: 'Renderer',
    key: 'use_vsync',
    transform: (value): VSyncMode => {
      return VSYNC_MODE_MAPPING[String(value)] ?? EdenDefaults.getDefaultVsyncMode()
    },
  },
  astc_recompression_method: {
    section: 'Renderer',
    key: 'astc_recompression',
    transform: (value): AstcRecompression => {
      return ASTC_RECOMPRESSION_MAPPING[String(value)] ?? EdenDefaults.getDefaultAstcRecompression()
    },
  },
  nvdec_emulation: {
    section: 'Renderer',
    key: 'nvdec_emulation',
    transform: (value): NvdecEmulation => {
      return NVDEC_EMULATION_MAPPING[String(value)] ?? EdenDefaults.getDefaultNvdecEmulation()
    },
  },
  vram_usage_mode: {
    section: 'Renderer',
    key: 'vram_usage_mode',
    transform: (value): VramUsageMode => {
      return VRAM_USAGE_MODE_MAPPING[String(value)] ?? EdenDefaults.getDefaultVramUsageMode()
    },
  },
  use_fast_gpu_time: {
    section: 'Renderer',
    key: 'use_fast_gpu_time',
    transform: (value) => Boolean(value),
  },
  extended_dynamic_state: {
    section: 'Renderer',
    key: 'dyna_state',
    transform: (value): DynamicState => {
      // Only use mapping - raw numbers should fall back to default
      return DYNAMIC_STATE_MAPPING[String(value)] ?? EdenDefaults.getDefaultDynamicState()
    },
  },
  provoking_vertex: {
    section: 'Renderer',
    key: 'provoking_vertex',
    transform: (value) => Boolean(value),
  },
  descriptor_indexing: {
    section: 'Renderer',
    key: 'descriptor_indexing',
    transform: (value) => Boolean(value),
  },
  accuracy_level: {
    section: 'Renderer',
    key: 'gpu_accuracy',
    transform: (value): GpuAccuracy => {
      return GPU_ACCURACY_MAPPING[String(value)] ?? EdenDefaults.getDefaultGpuAccuracy()
    },
  },
  rosolution: {
    // Note: typo in field name "rosolution" should be "resolution"
    section: 'Renderer',
    key: 'resolution_setup',
    transform: (value): ResolutionSetup => {
      const resStr = String(value)

      // First try using the helper function
      const multiplierResult = EdenDefaults.parseResolutionMultiplier(resStr)
      if (multiplierResult !== null) {
        return multiplierResult
      }

      // Check for pixel resolution patterns (e.g., "1280x720", "720p", "1080p")
      if (EdenDefaults.isPixelResolution(resStr)) {
        // These are pixel resolutions, not multipliers - default to native
        return EdenDefaults.getDefaultResolutionSetup()
      }

      // If it's a pure number (no 'x' or other characters), use it
      const trimmed = resStr.trim()
      if (/^\d+$/.test(trimmed)) {
        const directNumber = parseInt(trimmed, 10)
        if (!isNaN(directNumber) && directNumber >= 0 && directNumber <= 10) {
          return directNumber as ResolutionSetup
        }
      }

      // Default to native resolution
      return EdenDefaults.getDefaultResolutionSetup()
    },
  },
  window_adapting_filter: {
    section: 'Renderer',
    key: 'scaling_filter',
    transform: (value): ScalingFilter => {
      return SCALING_FILTER_MAPPING[String(value)] ?? EdenDefaults.getDefaultScalingFilter()
    },
  },
  optimize_spirv_output: {
    section: 'Renderer',
    key: 'optimize_spirv_output',
    transform: (value): OptimizeSpirvOutput => {
      return (
        OPTIMIZE_SPIRV_OUTPUT_MAPPING[String(value)] ?? EdenDefaults.getDefaultOptimizeSpirvOutput()
      )
    },
  },

  // Audio Section
  audio_output_engine: {
    section: 'Audio',
    key: 'output_engine',
    transform: (value): AudioOutputEngine => {
      return (
        AUDIO_OUTPUT_ENGINE_MAPPING[String(value)] ?? EdenDefaults.getDefaultAudioOutputEngine()
      )
    },
  },

  // System Section
  docked_mode: {
    section: 'System',
    key: 'use_docked_mode',
    transform: (value) => Boolean(value),
  },
  enable_lru_cache: {
    section: 'System',
    key: 'use_lru_cache',
    transform: (value) => Boolean(value),
  },

  /**
   * Parses driver version value with new separator format: "display|||filename"
   * Falls back to legacy formats for backward compatibility
   */
  dynamic_driver_version: {
    section: 'GpuDriver',
    key: 'driver_path',
    transform: (value) => {
      const BASE_DRIVER_PATH =
        '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers'
      const driverString = String(value).trim()

      if (EdenDefaults.isNoDriverValue(driverString)) return undefined

      // Check for new separator format first: "display|||filename"
      if (driverString.includes('|||')) {
        const parts = driverString.split('|||')
        const displayPart = parts[0]
        const filenamePart = parts[1]

        if (filenamePart && filenamePart.trim() !== '') {
          let filename = filenamePart.trim()

          // Ensure .adpkg files have .zip extension for Eden
          if (filename.endsWith('.adpkg') && !filename.endsWith('.adpkg.zip')) {
            filename = `${filename}.zip`
          }

          return `${BASE_DRIVER_PATH}/${filename}`
        } else {
          // No filename, fallback to trying to extract from display part
          const bracketMatch = displayPart.match(/\]\s*(.+\.adpkg)/i)
          if (bracketMatch && bracketMatch[1]) return `${BASE_DRIVER_PATH}/${bracketMatch[1]}.zip`
          // Use the display part as-is
          return `${BASE_DRIVER_PATH}/${displayPart}.adpkg.zip`
        }
      }

      // Try to parse as JSON for backward compatibility with any existing JSON data
      try {
        const parsed = JSON.parse(driverString)
        if (parsed.filename && parsed.filename.trim() !== '') {
          let filename = parsed.filename

          if (filename.endsWith('.adpkg') && !filename.endsWith('.adpkg.zip')) {
            filename = `${filename}.zip`
          }

          return `${BASE_DRIVER_PATH}/${filename}`
        } else if (typeof parsed === 'object' && 'display' in parsed) {
          // JSON format but no filename - shouldn't happen anymore but handle it
          const displayName = parsed.display || driverString
          const bracketMatch = displayName.match(/\]\s*(.+\.adpkg)/i)
          if (bracketMatch && bracketMatch[1]) {
            return `${BASE_DRIVER_PATH}/${bracketMatch[1]}.zip`
          }
          return `${BASE_DRIVER_PATH}/${displayName}.adpkg.zip`
        }
      } catch {
        // Not JSON, continue to legacy format handling
      }

      // Legacy format handling for backward compatibility
      const bracketMatch = driverString.match(/\]\s*(.+\.adpkg)/i)
      if (bracketMatch && bracketMatch[1]) {
        return `${BASE_DRIVER_PATH}/${bracketMatch[1]}.zip`
      }

      if (driverString.toLowerCase().endsWith('.adpkg')) {
        const filename = driverString.split('/').pop() || driverString
        return `${BASE_DRIVER_PATH}/${filename}.zip`
      }

      if (driverString.startsWith('/') && driverString.includes('gpu_drivers')) {
        return driverString
      }

      if (EdenDefaults.isCommonDriverName(driverString)) {
        return `${BASE_DRIVER_PATH}/${driverString}.adpkg.zip`
      }

      // For unrecognized formats, return undefined to use default driver
      return undefined
    },
  },
}

/**
 * Get default Eden configuration with deep copy to avoid shared state
 */
function getDefaultConfig(): EdenConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as EdenConfig
}

/**
 * Convert listing data to Eden configuration
 */
export function convertToEdenConfig(input: EdenConfigInput): EdenConfig {
  const config = getDefaultConfig()

  // Process each custom field value
  for (const fieldValue of input.customFieldValues) {
    const fieldName = fieldValue.customFieldDefinition.name
    const mapping = FIELD_MAPPINGS[fieldName]

    if (mapping) {
      const transformedValue = mapping.transform
        ? mapping.transform(fieldValue.value)
        : String(fieldValue.value)

      if (transformedValue === undefined) {
        continue
      }

      const section = config[mapping.section]
      if (section && section[mapping.key as keyof typeof section]) {
        const configValue = section[mapping.key as keyof typeof section] as
          | BooleanConfigValue
          | IntConfigValue
          | StringConfigValue

        configValue.value = transformedValue
        if (mapping.key === 'driver_path' && transformedValue === '') {
          configValue.use_global = true
        } else {
          configValue.use_global = false
          configValue.default = false as unknown as typeof configValue.default
        }
      }
    }
  }

  const fastCpuTime = input.customFieldValues.find(
    (v) => v.customFieldDefinition.name === 'fast_cpu_time',
  )
  if (fastCpuTime && config.Cpu) {
    const boolValue = Boolean(fastCpuTime.value)
    const numValue = boolValue ? 1 : 0
    if (config.Cpu.use_fast_cpu_time) {
      config.Cpu.use_fast_cpu_time.default = false
      config.Cpu.use_fast_cpu_time.value = boolValue
      config.Cpu.use_fast_cpu_time.use_global = false
    }
    if (config.Cpu.fast_cpu_time) {
      config.Cpu.fast_cpu_time.default = false as unknown as typeof config.Cpu.fast_cpu_time.default
      config.Cpu.fast_cpu_time.value = numValue
      config.Cpu.fast_cpu_time.use_global = false
    }
  }

  const fastGpuTime = input.customFieldValues.find(
    (v) => v.customFieldDefinition.name === 'use_fast_gpu_time',
  )
  if (fastGpuTime && config.Renderer) {
    const boolValue = Boolean(fastGpuTime.value)
    const numValue = boolValue ? 1 : 0
    if (config.Renderer.use_fast_gpu_time) {
      config.Renderer.use_fast_gpu_time.default = false
      config.Renderer.use_fast_gpu_time.value = boolValue
      config.Renderer.use_fast_gpu_time.use_global = false
    }
    if (config.Renderer.fast_gpu_time) {
      config.Renderer.fast_gpu_time.default =
        false as unknown as typeof config.Renderer.fast_gpu_time.default
      config.Renderer.fast_gpu_time.value = numValue
      config.Renderer.fast_gpu_time.use_global = false
    }
  }

  return config
}

/**
 * Serialize Eden configuration to .ini format
 */
export function serializeEdenConfig(config: EdenConfig): string {
  const lines: string[] = []
  const sectionOrder: Array<keyof EdenConfig> = [
    'Controls',
    'Core',
    'Cpu',
    'Renderer',
    'Audio',
    'System',
    'Linux',
    'GpuDriver',
  ]

  for (const sectionName of sectionOrder) {
    const section = config[sectionName]
    if (!section || Object.keys(section).length === 0) continue

    lines.push(`[${sectionName}]`)

    for (const [key, setting] of Object.entries(section)) {
      if (setting === null || setting === undefined) continue

      const configValue = setting as BooleanConfigValue | IntConfigValue | StringConfigValue

      if (configValue.use_global !== undefined) {
        lines.push(`${key}\\use_global=${configValue.use_global ? 'true' : 'false'}`)
      }

      if (configValue.default !== undefined) {
        const defaultValue = formatIniValue(configValue.default)
        lines.push(`${key}\\default=${defaultValue}`)
      }

      if (key === 'driver_path' && configValue.use_global === true && configValue.value === '') {
      } else if (configValue.value !== undefined) {
        const value = formatIniValue(configValue.value)
        lines.push(`${key}=${value}`)
      }
    }

    lines.push('')
    lines.push('')
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()

  return lines.join('\n')
}

/**
 * Format a value for INI output
 */
function formatIniValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  } else if (typeof value === 'number') {
    return String(value)
  } else if (typeof value === 'string') {
    return value.replace(/[\r\n]/g, '')
  } else if (value === null || value === undefined) {
    return ''
  } else {
    return String(value)
  }
}
