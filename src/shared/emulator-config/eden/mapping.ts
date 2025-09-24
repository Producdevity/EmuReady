import {
  ANTI_ALIASING_MAPPING,
  ASTC_RECOMPRESSION_MAPPING,
  AUDIO_OUTPUT_ENGINE_MAPPING,
  CPU_ACCURACY_MAPPING,
  CPU_BACKEND_MAPPING,
  DYNAMIC_STATE_MAPPING,
  EdenDefaults,
  GPU_ACCURACY_MAPPING,
  GPU_BACKEND_MAPPING,
  MAX_ANISOTROPY_MAPPING,
  NVDEC_EMULATION_MAPPING,
  OPTIMIZE_SPIRV_OUTPUT_MAPPING,
  SCALING_FILTER_MAPPING,
  VRAM_USAGE_MODE_MAPPING,
  VSYNC_MODE_MAPPING,
} from '@/server/utils/emulator-config/eden/eden.defaults'
import type {
  AntiAliasing,
  AstcRecompression,
  AudioOutputEngine,
  CpuAccuracy,
  CpuBackend,
  DynamicState,
  EdenConfig,
  EdenConfigSection,
  GpuAccuracy,
  GpuBackend,
  MaxAnisotropy,
  NvdecEmulation,
  OptimizeSpirvOutput,
  ScalingFilter,
  VramUsageMode,
  VSyncMode,
} from '@/server/utils/emulator-config/eden/eden.types'

const BOOLEAN_LIKE_KEYS = new Set(['use_vsync', 'use_asynchronous_shaders', 'use_video_framerate'])

function createReverseLookup<T extends Record<string, string | number | boolean>>(mapping: T) {
  const reverse: Record<string, string> = {}
  for (const [customValue, configValue] of Object.entries(mapping)) {
    const key = String(configValue)
    if (!(key in reverse)) {
      reverse[key] = customValue
    }
  }
  return reverse
}

const CPU_BACKEND_REVERSE = createReverseLookup(CPU_BACKEND_MAPPING)
const CPU_ACCURACY_REVERSE = createReverseLookup(CPU_ACCURACY_MAPPING)
const GPU_BACKEND_REVERSE = createReverseLookup(GPU_BACKEND_MAPPING)
const GPU_ACCURACY_REVERSE = createReverseLookup(GPU_ACCURACY_MAPPING)
const ANTI_ALIASING_REVERSE = createReverseLookup(ANTI_ALIASING_MAPPING)
const MAX_ANISOTROPY_REVERSE = createReverseLookup(MAX_ANISOTROPY_MAPPING)
const VSYNC_MODE_REVERSE = createReverseLookup(VSYNC_MODE_MAPPING)
const ASTC_RECOMPRESSION_REVERSE = createReverseLookup(ASTC_RECOMPRESSION_MAPPING)
const NVDEC_EMULATION_REVERSE = createReverseLookup(NVDEC_EMULATION_MAPPING)
const VRAM_USAGE_MODE_REVERSE = createReverseLookup(VRAM_USAGE_MODE_MAPPING)
const DYNAMIC_STATE_REVERSE = createReverseLookup(DYNAMIC_STATE_MAPPING)
const SCALING_FILTER_REVERSE = createReverseLookup(SCALING_FILTER_MAPPING)
const OPTIMIZE_SPIRV_REVERSE = createReverseLookup(OPTIMIZE_SPIRV_OUTPUT_MAPPING)
const AUDIO_OUTPUT_ENGINE_REVERSE = createReverseLookup(AUDIO_OUTPUT_ENGINE_MAPPING)

export interface EdenFieldMapping {
  section: EdenConfigSection
  key: string
  toConfig?: (value: unknown) => string | number | boolean | undefined
  fromConfig?: (config: EdenConfig) => unknown
}

export const EDEN_FIELD_MAPPINGS: Record<string, EdenFieldMapping> = {
  cpu_backend: {
    section: 'Cpu',
    key: 'cpu_backend',
    toConfig: (value): CpuBackend =>
      CPU_BACKEND_MAPPING[String(value)] ?? EdenDefaults.getDefaultCpuBackend(),
  },
  cpu_accuracy: {
    section: 'Cpu',
    key: 'cpu_accuracy',
    toConfig: (value): CpuAccuracy =>
      CPU_ACCURACY_MAPPING[String(value)] ?? EdenDefaults.getDefaultCpuAccuracy(),
  },
  fast_cpu_time: {
    section: 'Cpu',
    key: 'fast_cpu_time',
    toConfig: (value) => Boolean(value),
  },
  synchronize_core_speed: {
    section: 'Core',
    key: 'sync_core_speed',
    toConfig: (value) => Boolean(value),
  },
  gpu_api: {
    section: 'Renderer',
    key: 'backend',
    toConfig: (value): GpuBackend =>
      GPU_BACKEND_MAPPING[String(value)] ?? EdenDefaults.getDefaultGpuBackend(),
  },
  disk_shader_cache: {
    section: 'Renderer',
    key: 'use_disk_shader_cache',
    toConfig: (value) => Boolean(value),
  },
  use_async_shaders: {
    section: 'Renderer',
    key: 'use_asynchronous_shaders',
    toConfig: (value) => Boolean(value),
  },
  use_reactive_flushing: {
    section: 'Renderer',
    key: 'use_reactive_flushing',
    toConfig: (value) => Boolean(value),
  },
  anti_aliasing_method: {
    section: 'Renderer',
    key: 'anti_aliasing',
    toConfig: (value): AntiAliasing =>
      ANTI_ALIASING_MAPPING[String(value)] ?? EdenDefaults.getDefaultAntiAliasing(),
  },
  anisotropic_filtering: {
    section: 'Renderer',
    key: 'max_anisotropy',
    toConfig: (value): MaxAnisotropy =>
      MAX_ANISOTROPY_MAPPING[String(value)] ?? EdenDefaults.getDefaultMaxAnisotropy(),
  },
  vsync_mode: {
    section: 'Renderer',
    key: 'use_vsync',
    toConfig: (value): VSyncMode =>
      VSYNC_MODE_MAPPING[String(value)] ?? EdenDefaults.getDefaultVsyncMode(),
  },
  astc_recompression_method: {
    section: 'Renderer',
    key: 'astc_recompression',
    toConfig: (value): AstcRecompression =>
      ASTC_RECOMPRESSION_MAPPING[String(value)] ?? EdenDefaults.getDefaultAstcRecompression(),
  },
  nvdec_emulation: {
    section: 'Renderer',
    key: 'nvdec_emulation',
    toConfig: (value): NvdecEmulation =>
      NVDEC_EMULATION_MAPPING[String(value)] ?? EdenDefaults.getDefaultNvdecEmulation(),
  },
  vram_usage_mode: {
    section: 'Renderer',
    key: 'vram_usage_mode',
    toConfig: (value): VramUsageMode =>
      VRAM_USAGE_MODE_MAPPING[String(value)] ?? EdenDefaults.getDefaultVramUsageMode(),
  },
  use_fast_gpu_time: {
    section: 'Renderer',
    key: 'use_fast_gpu_time',
    toConfig: (value) => Boolean(value),
  },
  enhanced_frame_pacing: {
    section: 'Renderer',
    key: 'use_video_framerate',
    toConfig: (value) => Boolean(value),
  },
  extended_dynamic_state: {
    section: 'Renderer',
    key: 'dyna_state',
    toConfig: (value): DynamicState => {
      if (typeof value === 'number') {
        const boundedValue = Math.min(3, Math.max(0, Math.round(value)))
        return boundedValue as DynamicState
      }

      if (typeof value === 'string' && value.trim().length > 0) {
        const numericValue = Number(value)
        if (!Number.isNaN(numericValue)) {
          const boundedValue = Math.min(3, Math.max(0, Math.round(numericValue)))
          return boundedValue as DynamicState
        }
      }

      const mapped = DYNAMIC_STATE_MAPPING[String(value)]
      if (mapped !== undefined) {
        return mapped
      }

      return EdenDefaults.getDefaultDynamicState()
    },
  },
  provoking_vertex: {
    section: 'Renderer',
    key: 'provoking_vertex',
    toConfig: (value) => Boolean(value),
  },
  descriptor_indexing: {
    section: 'Renderer',
    key: 'descriptor_indexing',
    toConfig: (value) => Boolean(value),
  },
  accuracy_level: {
    section: 'Renderer',
    key: 'gpu_accuracy',
    toConfig: (value): GpuAccuracy =>
      GPU_ACCURACY_MAPPING[String(value)] ?? EdenDefaults.getDefaultGpuAccuracy(),
  },
  rosolution: {
    section: 'Renderer',
    key: 'resolution_setup',
  },
  resolution: {
    section: 'Renderer',
    key: 'resolution_setup',
  },
  window_adapting_filter: {
    section: 'Renderer',
    key: 'scaling_filter',
    toConfig: (value): ScalingFilter =>
      SCALING_FILTER_MAPPING[String(value)] ?? EdenDefaults.getDefaultScalingFilter(),
  },
  optimize_spirv_output: {
    section: 'Renderer',
    key: 'optimize_spirv_output',
    toConfig: (value): OptimizeSpirvOutput =>
      OPTIMIZE_SPIRV_OUTPUT_MAPPING[String(value)] ?? EdenDefaults.getDefaultOptimizeSpirvOutput(),
  },
  audio_output_engine: {
    section: 'Audio',
    key: 'output_engine',
    toConfig: (value): AudioOutputEngine =>
      AUDIO_OUTPUT_ENGINE_MAPPING[String(value)] ?? EdenDefaults.getDefaultAudioOutputEngine(),
  },
  docked_mode: {
    section: 'System',
    key: 'use_docked_mode',
    toConfig: (value) => Boolean(value),
  },
  enable_lru_cache: {
    section: 'System',
    key: 'use_lru_cache',
    toConfig: (value) => Boolean(value),
  },
  dynamic_driver_version: {
    section: 'GpuDriver',
    key: 'driver_path',
  },
}

export function applyEdenMapping(
  config: EdenConfig,
  mapping: EdenFieldMapping,
  value: unknown,
): void {
  const section = config[mapping.section]
  if (!section) return

  if (mapping.key in section) {
    const configValue = section[mapping.key as keyof typeof section]
    if (configValue && typeof configValue === 'object') {
      const transform = mapping.toConfig
      const newValue = transform ? transform(value) : value
      if (newValue === undefined) return

      if ('value' in configValue) {
        ;(configValue as { value: unknown }).value = newValue
      }

      if ('use_global' in configValue) {
        ;(configValue as { use_global: boolean }).use_global =
          mapping.key === 'driver_path' && newValue === ''
      }

      const defaultContainer = configValue as { value?: unknown; default?: unknown }
      if (mapping.key !== 'driver_path' || newValue !== '') {
        if (BOOLEAN_LIKE_KEYS.has(mapping.key)) {
          defaultContainer.default = false
        } else if (typeof defaultContainer.value === 'number') {
          defaultContainer.default = 0
        } else if (typeof defaultContainer.value === 'boolean') {
          defaultContainer.default = false
        } else if (mapping.key === 'driver_path') {
          defaultContainer.default = false
        }
      } else {
        defaultContainer.default = false
      }
    }
  }
}

export function edenConfigValueToCustomValue(mappingKey: string, rawValue: unknown): unknown {
  const valueKey = String(rawValue)

  switch (mappingKey) {
    case 'cpu_backend':
      return CPU_BACKEND_REVERSE[valueKey]
    case 'cpu_accuracy':
      return CPU_ACCURACY_REVERSE[valueKey]
    case 'backend':
      return GPU_BACKEND_REVERSE[valueKey]
    case 'gpu_accuracy':
      return GPU_ACCURACY_REVERSE[valueKey]
    case 'anti_aliasing':
      return ANTI_ALIASING_REVERSE[valueKey]
    case 'max_anisotropy':
      return MAX_ANISOTROPY_REVERSE[valueKey]
    case 'use_vsync':
      return VSYNC_MODE_REVERSE[valueKey]
    case 'astc_recompression':
      return ASTC_RECOMPRESSION_REVERSE[valueKey]
    case 'nvdec_emulation':
      return NVDEC_EMULATION_REVERSE[valueKey]
    case 'vram_usage_mode':
      return VRAM_USAGE_MODE_REVERSE[valueKey]
    case 'dyna_state':
      if (typeof rawValue === 'number') {
        return rawValue
      }

      if (typeof rawValue === 'string') {
        const numericValue = Number(rawValue)
        if (!Number.isNaN(numericValue)) {
          return numericValue
        }
      }

      return DYNAMIC_STATE_REVERSE[valueKey]
    case 'scaling_filter':
      return SCALING_FILTER_REVERSE[valueKey]
    case 'optimize_spirv_output':
      return OPTIMIZE_SPIRV_REVERSE[valueKey]
    case 'output_engine':
      return AUDIO_OUTPUT_ENGINE_REVERSE[valueKey]
    case 'use_disk_shader_cache':
    case 'use_asynchronous_shaders':
    case 'use_reactive_flushing':
    case 'use_fast_gpu_time':
    case 'use_video_framerate':
    case 'provoking_vertex':
    case 'descriptor_indexing':
    case 'use_docked_mode':
    case 'use_lru_cache':
    case 'sync_core_speed':
      return Boolean(rawValue)
    case 'fast_cpu_time':
    case 'fast_gpu_time':
      return Number(rawValue)
    case 'resolution_setup':
      return Number(rawValue)
    default:
      return rawValue
  }
}
