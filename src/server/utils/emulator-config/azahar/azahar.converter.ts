/**
 * Azahar Emulator Configuration Converter
 * Converts listing data with custom field values to Azahar .ini format
 */

import { AzaharDefaults, GPU_BACKEND_MAPPING, RESOLUTION_FACTOR_MAPPING } from './azahar.defaults'
import type {
  AzaharConfig,
  AzaharConfigSection,
  GraphicsApi,
  ResolutionFactor,
  TextureFilter,
  TextureSampling,
  LayoutOption,
  StereoRenderOption,
  Microseconds0To16000,
} from './azahar.types'
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

export interface AzaharConfigInput {
  listingId: string
  gameId: string
  customFieldValues: CustomFieldValue[]
}

interface FieldMapping {
  section: AzaharConfigSection
  key: string
  transform?: (value: unknown) => unknown
}

const TEXTURE_FILTER_MAPPING: Record<string, TextureFilter> = {
  None: 0,
  'No Filter': 0,
  Anime4K: 1,
  Bicubic: 2,
  ScaleForce: 3,
  xBRZ: 4,
  MMPX: 5,
}

const TEXTURE_SAMPLING_MAPPING: Record<string, TextureSampling> = {
  'Game Controlled': 0,
  GameControlled: 0,
  'Nearest Neighbor': 1,
  Nearest: 1,
  Linear: 2,
}

const LAYOUT_OPTION_MAPPING: Record<string, LayoutOption> = {
  Default: 0,
  'Single Screen': 1,
  SingleScreen: 1,
  'Large Screen': 2,
  LargeScreen: 2,
  'Side by Side': 3,
  SideScreen: 3,
  'Side Screen': 3,
  'Hybrid Screen': 4,
  HybridScreen: 4,
  'Separate Windows': 4,
  'Custom Layout': 5,
  CustomLayout: 5,
}

const STEREO_RENDER_MODE_MAPPING: Record<string, StereoRenderOption> = {
  Off: 0,
  'Side by Side': 1,
  'Reverse Side by Side': 2,
  Anaglyph: 3,
  Interlaced: 4,
  'Reverse Interlaced': 5,
  'Cardboard VR': 6,
}

const FIELD_MAPPINGS: Record<string, FieldMapping> = {
  graphics_api: {
    section: 'Renderer',
    key: 'graphics_api',
    transform: toGraphicsApi,
  },
  enable_spiri_v_shader_generation: {
    section: 'Renderer',
    key: 'spirv_shader_gen',
    transform: toBoolean,
  },
  disable_spir_v_optimizer: {
    section: 'Renderer',
    key: 'disable_spirv_optimizer',
    transform: toBoolean,
  },
  enable_async_shader_complication: {
    section: 'Renderer',
    key: 'async_shader_compilation',
    transform: toBoolean,
  },
  internal_resolution: {
    section: 'Renderer',
    key: 'resolution_factor',
    transform: toResolutionFactor,
  },
  linear_filtering: {
    section: 'Renderer',
    key: 'filter_mode',
    transform: toBoolean,
  },
  accurate_multiplication: {
    section: 'Renderer',
    key: 'shaders_accurate_mul',
    transform: toBoolean,
  },
  disk_shader_cache: {
    section: 'Renderer',
    key: 'use_disk_shader_cache',
    transform: toBoolean,
  },
  texture_filter: {
    section: 'Renderer',
    key: 'texture_filter',
    transform: (value) => mapFromDictionary(TEXTURE_FILTER_MAPPING, value),
  },
  texture_sampling: {
    section: 'Renderer',
    key: 'texture_sampling',
    transform: (value) => mapFromDictionary(TEXTURE_SAMPLING_MAPPING, value),
  },
  delay_game_render_thread: {
    section: 'Renderer',
    key: 'delay_game_render_thread_us',
    transform: toDelayGameRenderThread,
  },
  stereoscopic_3d_mode: {
    section: 'Renderer',
    key: 'render_3d',
    transform: (value) => mapFromDictionary(STEREO_RENDER_MODE_MAPPING, value),
  },
  cpu_jit: {
    section: 'Core',
    key: 'use_cpu_jit',
    transform: toBoolean,
  },
  enable_hardware_shader: {
    section: 'Renderer',
    key: 'use_hw_shader',
    transform: toBoolean,
  },
  enable_vsync: {
    section: 'Renderer',
    key: 'use_vsync_new',
    transform: toBoolean,
  },
  delay_start_with_lle_modules: {
    section: 'Debugging',
    key: 'delay_start_for_lle_modules',
    transform: toBoolean,
  },
  layout_option: {
    section: 'Layout',
    key: 'layout_option',
    transform: (value) => mapFromDictionary(LAYOUT_OPTION_MAPPING, value),
  },
  swap_screen: {
    section: 'Layout',
    key: 'swap_screen',
    transform: toBoolean,
  },
  upright_screen: {
    section: 'Layout',
    key: 'upright_screen',
    transform: toBoolean,
  },
}

export function convertToAzaharConfig(input: AzaharConfigInput): AzaharConfig {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: expected an object')
  }

  if (!Array.isArray(input.customFieldValues)) {
    throw new Error('Invalid input: customFieldValues must be an array')
  }

  const config: AzaharConfig = {}

  for (const fieldValue of input.customFieldValues) {
    if (!fieldValue || typeof fieldValue !== 'object') continue
    if (!fieldValue.customFieldDefinition || typeof fieldValue.customFieldDefinition !== 'object') {
      continue
    }

    const fieldName = fieldValue.customFieldDefinition.name
    const mapping = FIELD_MAPPINGS[fieldName]
    if (!mapping) continue

    const transformedValue = mapping.transform
      ? mapping.transform(fieldValue.value)
      : fieldValue.value

    if (transformedValue !== undefined) {
      setConfigValue(config, mapping.section, mapping.key, transformedValue)
      continue
    }

    applyDefaultValue(config, mapping.section, mapping.key)
  }

  return config
}

export function serializeAzaharConfig(config: AzaharConfig): string {
  const lines: string[] = []
  const sectionOrder: AzaharConfigSection[] = [
    'Controls',
    'Core',
    'Renderer',
    'Audio',
    'System',
    'Layout',
    'DataStorage',
    'Camera',
    'Utility',
    'Storage',
    'Debugging',
    'Miscellaneous',
    'WebService',
  ]

  for (const sectionName of sectionOrder) {
    const section = config[sectionName]
    if (!section) continue

    const entries = Object.entries(section).filter(
      ([, value]) => value && value.value !== undefined,
    )
    if (entries.length === 0) continue

    lines.push(`[${sectionName}]`)
    for (const [key, configValue] of entries) {
      const value = configValue.value
      lines.push(`${key}=${formatIniValue(value)}`)
    }
    lines.push('')
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }

  return lines.join('\n')
}

function setConfigValue(
  config: AzaharConfig,
  section: AzaharConfigSection,
  key: string,
  value: unknown,
): void {
  const targetSection = (config[section] ??= {}) as Record<string, { value?: unknown }>
  targetSection[key] = { value }
}

function applyDefaultValue(config: AzaharConfig, section: AzaharConfigSection, key: string): void {
  const defaults = DefaultValueReaders[section]?.[key]
  if (!defaults) return

  const defaultValue = defaults()
  if (defaultValue === undefined) return

  setConfigValue(config, section, key, defaultValue)
}

type DefaultReaders = Record<string, () => unknown>

const DefaultValueReaders: Partial<Record<AzaharConfigSection, DefaultReaders>> = {
  Controls: {
    use_artic_base_controller: AzaharDefaults.getDefaultUseArticBaseController,
  },
  Core: {
    use_cpu_jit: AzaharDefaults.getDefaultUseCpuJit,
  },
  Renderer: {
    graphics_api: AzaharDefaults.getDefaultGpuBackend,
    resolution_factor: AzaharDefaults.getDefaultResolutionFactor,
    use_frame_limit: AzaharDefaults.getDefaultUseFrameLimit,
    frame_limit: AzaharDefaults.getDefaultFrameLimit,
    turbo_limit: AzaharDefaults.getDefaultTurboLimit,
    use_vsync_new: AzaharDefaults.getDefaultUseVsync,
    texture_filter: AzaharDefaults.getDefaultTextureFilter,
    texture_sampling: AzaharDefaults.getDefaultTextureSampling,
    spirv_shader_gen: AzaharDefaults.getDefaultSpirvShaderGen,
    disable_spirv_optimizer: AzaharDefaults.getDefaultDisableSpirvOptimizer,
    async_shader_compilation: AzaharDefaults.getDefaultAsyncShaders,
    async_presentation: AzaharDefaults.getDefaultAsyncPresentation,
    use_hw_shader: AzaharDefaults.getDefaultUseHwShader,
    shaders_accurate_mul: AzaharDefaults.getDefaultShadersAccurateMul,
    use_shader_jit: AzaharDefaults.getDefaultUseShaderJit,
    delay_game_render_thread_us: AzaharDefaults.getDefaultDelayGameRenderThreadUs,
    use_disk_shader_cache: AzaharDefaults.getDefaultDiskShaderCache,
    render_3d: AzaharDefaults.getDefaultRender3D,
    factor_3d: AzaharDefaults.getDefaultFactor3D,
    mono_render_option: AzaharDefaults.getDefaultMonoRenderOption,
    filter_mode: AzaharDefaults.getDefaultFilterMode,
    pp_shader_name: AzaharDefaults.getDefaultPpShaderName,
    anaglyph_shader_name: AzaharDefaults.getDefaultAnaglyphShaderName,
    bg_red: AzaharDefaults.getDefaultBgRed,
    bg_green: AzaharDefaults.getDefaultBgGreen,
    bg_blue: AzaharDefaults.getDefaultBgBlue,
    disable_right_eye_render: AzaharDefaults.getDefaultDisableRightEyeRender,
  },
  Audio: {
    audio_emulation: AzaharDefaults.getDefaultAudioEmulation,
    volume: AzaharDefaults.getDefaultAudioVolume,
    enable_audio_stretching: AzaharDefaults.getDefaultAudioStretching,
    enable_realtime_audio: AzaharDefaults.getDefaultRealtimeAudio,
    output_type: AzaharDefaults.getDefaultAudioOutputType,
    output_device: AzaharDefaults.getDefaultAudioOutputDevice,
    input_type: AzaharDefaults.getDefaultAudioInputType,
    input_device: AzaharDefaults.getDefaultAudioInputDevice,
  },
  System: {
    is_new_3ds: AzaharDefaults.getDefaultIsNew3ds,
    region_value: AzaharDefaults.getDefaultRegionValue,
    lle_applets: AzaharDefaults.getDefaultLleApplets,
    enable_required_online_lle_modules: AzaharDefaults.getDefaultEnableRequiredOnlineLleModules,
    plugin_loader: AzaharDefaults.getDefaultPluginLoader,
    allow_plugin_loader: AzaharDefaults.getDefaultAllowPluginLoader,
    steps_per_hour: AzaharDefaults.getDefaultStepsPerHour,
  },
  DataStorage: {
    use_virtual_sd: AzaharDefaults.getDefaultUseVirtualSd,
    use_custom_storage: AzaharDefaults.getDefaultUseCustomStorage,
  },
  Layout: {
    aspect_ratio: AzaharDefaults.getDefaultAspectRatio,
    layout_option: AzaharDefaults.getDefaultLayoutOption,
    upright_screen: AzaharDefaults.getDefaultUprightScreen,
    swap_screen: AzaharDefaults.getDefaultSwapScreen,
    secondary_display_layout: AzaharDefaults.getDefaultSecondaryDisplayLayout,
    performance_overlay_position: AzaharDefaults.getDefaultPerformanceOverlayPosition,
    expand_to_cutout_area: AzaharDefaults.getDefaultExpandToCutoutArea,
    screen_orientation: AzaharDefaults.getDefaultScreenOrientation,
    overlay_show_fps: AzaharDefaults.getDefaultOverlayShowFps,
    overlay_show_frame_time: AzaharDefaults.getDefaultOverlayShowFrameTime,
    overlay_show_speed: AzaharDefaults.getDefaultOverlayShowSpeed,
    overlay_show_app_ram_usage: AzaharDefaults.getDefaultOverlayShowAppRamUsage,
    overlay_show_available_ram: AzaharDefaults.getDefaultOverlayShowAvailableRam,
    overlay_show_battery_temp: AzaharDefaults.getDefaultOverlayShowBatteryTemp,
    overlay_background: AzaharDefaults.getDefaultOverlayBackground,
    custom_top_x: AzaharDefaults.getDefaultCustomTopX,
    custom_top_y: AzaharDefaults.getDefaultCustomTopY,
    custom_top_width: AzaharDefaults.getDefaultCustomTopWidth,
    custom_top_height: AzaharDefaults.getDefaultCustomTopHeight,
    custom_bottom_x: AzaharDefaults.getDefaultCustomBottomX,
    custom_bottom_y: AzaharDefaults.getDefaultCustomBottomY,
    custom_bottom_width: AzaharDefaults.getDefaultCustomBottomWidth,
    custom_bottom_height: AzaharDefaults.getDefaultCustomBottomHeight,
    custom_second_layer_opacity: AzaharDefaults.getDefaultCustomSecondLayerOpacity,
    screen_top_stretch: AzaharDefaults.getDefaultScreenTopStretch,
    screen_top_leftright_padding: AzaharDefaults.getDefaultScreenTopLrPadding,
    screen_top_topbottom_padding: AzaharDefaults.getDefaultScreenTopTbPadding,
    screen_bottom_stretch: AzaharDefaults.getDefaultScreenBottomStretch,
    screen_bottom_leftright_padding: AzaharDefaults.getDefaultScreenBottomLrPadding,
    screen_bottom_topbottom_padding: AzaharDefaults.getDefaultScreenBottomTbPadding,
    portrait_layout_option: AzaharDefaults.getDefaultPortraitLayoutOption,
    custom_portrait_top_x: AzaharDefaults.getDefaultPortraitTopX,
    custom_portrait_top_y: AzaharDefaults.getDefaultPortraitTopY,
    custom_portrait_top_width: AzaharDefaults.getDefaultPortraitTopWidth,
    custom_portrait_top_height: AzaharDefaults.getDefaultPortraitTopHeight,
    custom_portrait_bottom_x: AzaharDefaults.getDefaultPortraitBottomX,
    custom_portrait_bottom_y: AzaharDefaults.getDefaultPortraitBottomY,
    custom_portrait_bottom_width: AzaharDefaults.getDefaultPortraitBottomWidth,
    custom_portrait_bottom_height: AzaharDefaults.getDefaultPortraitBottomHeight,
    screen_gap: AzaharDefaults.getDefaultScreenGap,
    large_screen_proportion: AzaharDefaults.getDefaultLargeScreenProportion,
    small_screen_position: AzaharDefaults.getDefaultSmallScreenPosition,
    cardboard_screen_size: AzaharDefaults.getDefaultCardboardScreenSize,
    cardboard_x_shift: AzaharDefaults.getDefaultCardboardXShift,
    cardboard_y_shift: AzaharDefaults.getDefaultCardboardYShift,
  },
  Camera: {
    camera_outer_right_name: AzaharDefaults.getDefaultCameraOuterRightName,
    camera_outer_right_config: AzaharDefaults.getDefaultCameraOuterRightConfig,
    camera_outer_right_flip: AzaharDefaults.getDefaultCameraOuterRightFlip,
    camera_outer_left_name: AzaharDefaults.getDefaultCameraOuterLeftName,
    camera_outer_left_config: AzaharDefaults.getDefaultCameraOuterLeftConfig,
    camera_outer_left_flip: AzaharDefaults.getDefaultCameraOuterLeftFlip,
    camera_inner_name: AzaharDefaults.getDefaultCameraInnerName,
    camera_inner_config: AzaharDefaults.getDefaultCameraInnerConfig,
    camera_inner_flip: AzaharDefaults.getDefaultCameraInnerFlip,
  },
  Debugging: {
    record_frame_times: AzaharDefaults.getDefaultRecordFrameTimes,
    renderer_debug: AzaharDefaults.getDefaultRendererDebug,
    use_gdbstub: AzaharDefaults.getDefaultUseGdbstub,
    gdbstub_port: AzaharDefaults.getDefaultGdbstubPort,
    instant_debug_log: AzaharDefaults.getDefaultInstantDebugLog,
    enable_rpc_server: AzaharDefaults.getDefaultEnableRpcServer,
    delay_start_for_lle_modules: AzaharDefaults.getDefaultDelayStartForLleModules,
    deterministic_async_operations: AzaharDefaults.getDefaultDeterministicAsyncOperations,
  },
  Miscellaneous: {
    log_filter: AzaharDefaults.getDefaultLogFilter,
    log_regex_filter: AzaharDefaults.getDefaultLogRegexFilter,
  },
  WebService: {
    web_api_url: AzaharDefaults.getDefaultWebApiUrl,
    citra_username: AzaharDefaults.getDefaultCitraUsername,
    citra_token: AzaharDefaults.getDefaultCitraToken,
  },
}

function mapFromDictionary<T>(dictionary: Record<string, T>, value: unknown): T | undefined {
  if (value === null || value === undefined) return undefined
  const raw = String(value).trim()
  if (raw === '') return undefined

  if (dictionary[raw] !== undefined) return dictionary[raw]

  const lower = raw.toLowerCase()
  for (const [key, mappedValue] of Object.entries(dictionary)) {
    if (key.toLowerCase() === lower) return mappedValue
  }

  return undefined
}

function toGraphicsApi(value: unknown): GraphicsApi | undefined {
  if (value === null || value === undefined) return undefined

  const raw = String(value).trim()
  if (raw === '') return undefined

  if (raw === 'OpenGLES') {
    return GPU_BACKEND_MAPPING.OpenGLES
  }

  if (GPU_BACKEND_MAPPING[raw] !== undefined) return GPU_BACKEND_MAPPING[raw]

  const lower = raw.toLowerCase()
  for (const [key, mappedValue] of Object.entries(GPU_BACKEND_MAPPING)) {
    if (key.toLowerCase() === lower) return mappedValue
  }

  return AzaharDefaults.getDefaultGpuBackend()
}

function toResolutionFactor(value: unknown): ResolutionFactor | undefined {
  if (value === null || value === undefined) return undefined

  if (typeof value === 'number' && Number.isFinite(value)) {
    const rounded = Math.round(value)
    if (rounded >= 0 && rounded <= 10) return rounded as ResolutionFactor
    return undefined
  }

  const raw = String(value).trim()
  if (raw === '') return undefined

  const mapped = RESOLUTION_FACTOR_MAPPING[raw.toLowerCase()]
  if (mapped !== undefined) return mapped as ResolutionFactor

  const numeric = Number(raw)
  if (!Number.isNaN(numeric)) {
    const rounded = Math.round(numeric)
    if (rounded >= 0 && rounded <= 10) return rounded as ResolutionFactor
  }

  return undefined
}

function toDelayGameRenderThread(value: unknown): Microseconds0To16000 | undefined {
  if (value === null || value === undefined) return undefined

  const numeric = Number(value)
  if (Number.isNaN(numeric)) return undefined

  const clamped = Math.max(0, Math.min(100, Math.round(numeric)))

  return (clamped * 100) as Microseconds0To16000
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
    if (normalized === '1') return true
    if (normalized === '0') return false
  }
  return undefined
}

function formatIniValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '0'
  if (value === null || value === undefined) return ''
  return String(value)
}
