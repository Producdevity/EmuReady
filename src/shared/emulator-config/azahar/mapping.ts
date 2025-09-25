import { AzaharDefaults } from '@/server/utils/emulator-config/azahar/azahar.defaults'
import {
  fromDelayGameRenderThread,
  fromGraphicsApi,
  fromLayoutOption,
  fromResolutionFactor,
  fromStereoRenderOption,
  fromTextureFilter,
  fromTextureSampling,
  mapLayoutOption,
  mapStereoRenderOption,
  mapTextureFilter,
  mapTextureSampling,
  toBoolean,
  toDelayGameRenderThread,
  toGraphicsApi,
  toResolutionFactor,
} from './transformers'
import type { AzaharConfigSection } from '@/server/utils/emulator-config/azahar/azahar.types'

export interface AzaharFieldMapping {
  section: AzaharConfigSection
  key: string
  toConfig?: (value: unknown) => unknown
  fromConfig?: (rawValue: unknown) => unknown
}

function booleanFromConfig(rawValue: unknown): boolean | undefined {
  const parsed = toBoolean(rawValue)
  return parsed === undefined ? undefined : parsed
}

export const AZAHAR_FIELD_MAPPINGS: Record<string, AzaharFieldMapping> = {
  graphics_api: {
    section: 'Renderer',
    key: 'graphics_api',
    toConfig: toGraphicsApi,
    fromConfig: (raw) => fromGraphicsApi(raw) ?? 'OpenGLES',
  },
  enable_spiri_v_shader_generation: {
    section: 'Renderer',
    key: 'spirv_shader_gen',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  disable_spir_v_optimizer: {
    section: 'Renderer',
    key: 'disable_spirv_optimizer',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  // Legacy misspelling kept for backward compatibility.
  // Correct field name is `enable_async_shader_compilation`.
  enable_async_shader_complication: {
    section: 'Renderer',
    key: 'async_shader_compilation',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  // Corrected field name (preferred)
  enable_async_shader_compilation: {
    section: 'Renderer',
    key: 'async_shader_compilation',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  internal_resolution: {
    section: 'Renderer',
    key: 'resolution_factor',
    toConfig: toResolutionFactor,
    fromConfig: (raw) =>
      fromResolutionFactor(raw) ??
      fromResolutionFactor(AzaharDefaults.getDefaultResolutionFactor()) ??
      'native',
  },
  linear_filtering: {
    section: 'Renderer',
    key: 'filter_mode',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  accurate_multiplication: {
    section: 'Renderer',
    key: 'shaders_accurate_mul',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  disk_shader_cache: {
    section: 'Renderer',
    key: 'use_disk_shader_cache',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  texture_filter: {
    section: 'Renderer',
    key: 'texture_filter',
    toConfig: mapTextureFilter,
    fromConfig: (raw) =>
      fromTextureFilter(raw) ??
      fromTextureFilter(AzaharDefaults.getDefaultTextureFilter()) ??
      'None',
  },
  texture_sampling: {
    section: 'Renderer',
    key: 'texture_sampling',
    toConfig: mapTextureSampling,
    fromConfig: (raw) =>
      fromTextureSampling(raw) ??
      fromTextureSampling(AzaharDefaults.getDefaultTextureSampling()) ??
      'Game Controlled',
  },
  delay_game_render_thread: {
    section: 'Renderer',
    key: 'delay_game_render_thread_us',
    toConfig: toDelayGameRenderThread,
    fromConfig: fromDelayGameRenderThread,
  },
  stereoscopic_3d_mode: {
    section: 'Renderer',
    key: 'render_3d',
    toConfig: mapStereoRenderOption,
    fromConfig: (raw) =>
      fromStereoRenderOption(raw) ??
      fromStereoRenderOption(AzaharDefaults.getDefaultRender3D()) ??
      'Off',
  },
  cpu_jit: {
    section: 'Core',
    key: 'use_cpu_jit',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  enable_hardware_shader: {
    section: 'Renderer',
    key: 'use_hw_shader',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  enable_vsync: {
    section: 'Renderer',
    key: 'use_vsync_new',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  delay_start_with_lle_modules: {
    section: 'Debugging',
    key: 'delay_start_for_lle_modules',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  layout_option: {
    section: 'Layout',
    key: 'layout_option',
    toConfig: mapLayoutOption,
    fromConfig: (raw) =>
      fromLayoutOption(raw) ??
      fromLayoutOption(AzaharDefaults.getDefaultLayoutOption()) ??
      'Default',
  },
  swap_screen: {
    section: 'Layout',
    key: 'swap_screen',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
  upright_screen: {
    section: 'Layout',
    key: 'upright_screen',
    toConfig: toBoolean,
    fromConfig: booleanFromConfig,
  },
}

export function azaharConfigValueToCustomValue(mappingKey: string, rawValue: unknown): unknown {
  switch (mappingKey) {
    case 'graphics_api':
      return fromGraphicsApi(rawValue)
    case 'spirv_shader_gen':
    case 'disable_spirv_optimizer':
    case 'async_shader_compilation':
    case 'filter_mode':
    case 'shaders_accurate_mul':
    case 'use_disk_shader_cache':
    case 'use_cpu_jit':
    case 'use_hw_shader':
    case 'use_vsync_new':
    case 'delay_start_for_lle_modules':
    case 'swap_screen':
    case 'upright_screen':
      return booleanFromConfig(rawValue)
    case 'resolution_factor': {
      const value = fromResolutionFactor(rawValue)
      if (value !== undefined) return value
      return fromResolutionFactor(AzaharDefaults.getDefaultResolutionFactor()) ?? 'native'
    }
    case 'texture_filter':
      return fromTextureFilter(rawValue)
    case 'texture_sampling':
      return fromTextureSampling(rawValue)
    case 'delay_game_render_thread_us':
      return fromDelayGameRenderThread(rawValue)
    case 'render_3d':
      return fromStereoRenderOption(rawValue)
    case 'layout_option':
      return fromLayoutOption(rawValue)
    default:
      return rawValue
  }
}

export function getAzaharDefaultValue(mappingKey: string): unknown {
  switch (mappingKey) {
    case 'graphics_api':
      return fromGraphicsApi(AzaharDefaults.getDefaultGpuBackend()) ?? 'OpenGLES'
    case 'spirv_shader_gen':
      return AzaharDefaults.getDefaultSpirvShaderGen()
    case 'disable_spirv_optimizer':
      return AzaharDefaults.getDefaultDisableSpirvOptimizer()
    case 'async_shader_compilation':
      return AzaharDefaults.getDefaultAsyncShaders()
    case 'resolution_factor':
      return fromResolutionFactor(AzaharDefaults.getDefaultResolutionFactor()) ?? 'native'
    case 'filter_mode':
      return AzaharDefaults.getDefaultFilterMode()
    case 'shaders_accurate_mul':
      return AzaharDefaults.getDefaultShadersAccurateMul()
    case 'use_disk_shader_cache':
      return AzaharDefaults.getDefaultDiskShaderCache()
    case 'texture_filter':
      return fromTextureFilter(AzaharDefaults.getDefaultTextureFilter()) ?? 'None'
    case 'texture_sampling':
      return fromTextureSampling(AzaharDefaults.getDefaultTextureSampling()) ?? 'Game Controlled'
    case 'delay_game_render_thread_us':
      return fromDelayGameRenderThread(AzaharDefaults.getDefaultDelayGameRenderThreadUs()) ?? 0
    case 'render_3d':
      return fromStereoRenderOption(AzaharDefaults.getDefaultRender3D()) ?? 'Off'
    case 'use_cpu_jit':
      return AzaharDefaults.getDefaultUseCpuJit()
    case 'use_hw_shader':
      return AzaharDefaults.getDefaultUseHwShader()
    case 'use_vsync_new':
      return AzaharDefaults.getDefaultUseVsync()
    case 'delay_start_for_lle_modules':
      return AzaharDefaults.getDefaultDelayStartForLleModules()
    case 'layout_option':
      return fromLayoutOption(AzaharDefaults.getDefaultLayoutOption()) ?? 'Default'
    case 'swap_screen':
      return AzaharDefaults.getDefaultSwapScreen()
    case 'upright_screen':
      return AzaharDefaults.getDefaultUprightScreen()
    default:
      return undefined
  }
}
