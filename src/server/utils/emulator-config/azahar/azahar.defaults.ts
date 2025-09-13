/**
 * Azahar Configuration Defaults
 *
 * Centralized defaults and mapping utilities for Azahar emulator INI output.
 *
 * Note: These defaults reflect conservative, broadly compatible settings and
 * map to Azahar's Android INI keys. Only write what you override.
 */

import type {
  GraphicsApi,
  ResolutionFactor,
  TextureFilter,
  TextureSampling,
  StereoRenderOption,
  MonoRenderOption,
  LayoutOption,
  PortraitLayoutOption,
  SecondaryDisplayLayout,
  AspectRatio,
  AudioEmulation,
  SmallScreenPosition,
  Percent0To1000,
  NormalizedFloat01,
  Float1To16,
  RegionValue,
  InitClock,
  InitTicks,
  PixelsU16,
  OpacityPercentU16,
  Microseconds0To16000,
  StereoscopyFactor,
  ScreenGap,
} from './azahar.types'

// Default GPU settings
export const DEFAULT_GPU_BACKEND: GraphicsApi = 2 // Vulkan (GraphicsAPI::Vulkan)

// Default internal resolution (1x)
export const DEFAULT_RESOLUTION_FACTOR: ResolutionFactor = 1 // 1x

// Default rendering toggles
export const DEFAULT_USE_FRAME_LIMIT: boolean = true
export const DEFAULT_FRAME_LIMIT: Percent0To1000 = 100 // 100%
export const DEFAULT_TURBO_LIMIT: Percent0To1000 = 200 // 200%
export const DEFAULT_USE_VSYNC: boolean = true
export const DEFAULT_ASYNC_SHADERS: boolean = true
export const DEFAULT_ASYNC_PRESENTATION: boolean = true
export const DEFAULT_DISK_SHADER_CACHE: boolean = true
export const DEFAULT_TEXTURE_FILTER: TextureFilter = 0 // NoFilter
export const DEFAULT_TEXTURE_SAMPLING: TextureSampling = 0 // GameControlled
export const DEFAULT_SPIRV_SHADER_GEN: boolean = true
export const DEFAULT_DISABLE_SPIRV_OPTIMIZER: boolean = true
export const DEFAULT_USE_HW_SHADER: boolean = true
export const DEFAULT_SHADERS_ACCURATE_MUL: boolean = true
export const DEFAULT_USE_SHADER_JIT: boolean = true
export const DEFAULT_DELAY_GAME_RENDER_THREAD_US: Microseconds0To16000 = 0
export const DEFAULT_RENDER_3D: StereoRenderOption = 0 // Off
export const DEFAULT_FACTOR_3D: StereoscopyFactor = 0
export const DEFAULT_MONO_RENDER_OPTION: MonoRenderOption = 0 // LeftEye
export const DEFAULT_FILTER_MODE: boolean = true
export const DEFAULT_PP_SHADER_NAME: string = 'None (builtin)'
export const DEFAULT_ANAGLYPH_SHADER_NAME: string = 'Dubois (builtin)'
export const DEFAULT_BG_RED: NormalizedFloat01 = 0
export const DEFAULT_BG_GREEN: NormalizedFloat01 = 0
export const DEFAULT_BG_BLUE: NormalizedFloat01 = 0
export const DEFAULT_DISABLE_RIGHT_EYE_RENDER: boolean = false

// Default audio
export const DEFAULT_AUDIO_VOLUME: NormalizedFloat01 = 1.0
export const DEFAULT_AUDIO_STRETCHING: boolean = true
export const DEFAULT_REALTIME_AUDIO: boolean = false
export const DEFAULT_AUDIO_EMULATION: AudioEmulation = 0 // HLE

// Default system
export const DEFAULT_IS_NEW_3DS: boolean = true
export const DEFAULT_REGION_VALUE: RegionValue = -1 // Auto

// Default layout
export const DEFAULT_ASPECT_RATIO: AspectRatio = 0
export const DEFAULT_LAYOUT_OPTION: LayoutOption = 0
export const DEFAULT_UPRIGHT_SCREEN: boolean = false
export const DEFAULT_SWAP_SCREEN: boolean = false
export const DEFAULT_SECONDARY_DISPLAY_LAYOUT: SecondaryDisplayLayout = 0
export const DEFAULT_PORTRAIT_LAYOUT_OPTION: PortraitLayoutOption = 0
export const DEFAULT_CUSTOM_TOP_X: PixelsU16 = 0
export const DEFAULT_CUSTOM_TOP_Y: PixelsU16 = 0
export const DEFAULT_CUSTOM_TOP_WIDTH: PixelsU16 = 800
export const DEFAULT_CUSTOM_TOP_HEIGHT: PixelsU16 = 480
export const DEFAULT_CUSTOM_BOTTOM_X: PixelsU16 = 80
export const DEFAULT_CUSTOM_BOTTOM_Y: PixelsU16 = 500
export const DEFAULT_CUSTOM_BOTTOM_WIDTH: PixelsU16 = 640
export const DEFAULT_CUSTOM_BOTTOM_HEIGHT: PixelsU16 = 480
export const DEFAULT_CUSTOM_SECOND_LAYER_OPACITY: OpacityPercentU16 = 100
export const DEFAULT_SCREEN_TOP_STRETCH: boolean = false
export const DEFAULT_SCREEN_TOP_LR_PADDING: PixelsU16 = 0
export const DEFAULT_SCREEN_TOP_TB_PADDING: PixelsU16 = 0
export const DEFAULT_SCREEN_BOTTOM_STRETCH: boolean = false
export const DEFAULT_SCREEN_BOTTOM_LR_PADDING: PixelsU16 = 0
export const DEFAULT_SCREEN_BOTTOM_TB_PADDING: PixelsU16 = 0
export const DEFAULT_PORTRAIT_TOP_X: PixelsU16 = 0
export const DEFAULT_PORTRAIT_TOP_Y: PixelsU16 = 0
export const DEFAULT_PORTRAIT_TOP_WIDTH: PixelsU16 = 800
export const DEFAULT_PORTRAIT_TOP_HEIGHT: PixelsU16 = 480
export const DEFAULT_PORTRAIT_BOTTOM_X: PixelsU16 = 80
export const DEFAULT_PORTRAIT_BOTTOM_Y: PixelsU16 = 500
export const DEFAULT_PORTRAIT_BOTTOM_WIDTH: PixelsU16 = 640
export const DEFAULT_PORTRAIT_BOTTOM_HEIGHT: PixelsU16 = 480
export const DEFAULT_SCREEN_GAP: ScreenGap = 0
export const DEFAULT_LARGE_SCREEN_PROPORTION: Float1To16 = 4 // core default 4.0f
export const DEFAULT_SMALL_SCREEN_POSITION: SmallScreenPosition = 2 // BottomRight

// Mapping objects for user-friendly values to Azahar internal values
export const GPU_BACKEND_MAPPING: Record<string, GraphicsApi> = {
  Vulkan: 2,
  OpenGL: 1,
  Software: 0,
}

// Exact mapping per Azahar Android UI (0 = Auto, 1..10 = 1x..10x)
export const RESOLUTION_FACTOR_MAPPING: Record<string, ResolutionFactor | 0> = {
  auto: 0,
  '1x': 1,
  '2x': 2,
  '3x': 3,
  '4x': 4,
  '5x': 5,
  '6x': 6,
  '7x': 7,
  '8x': 8,
  '9x': 9,
  '10x': 10,
}

export const AzaharDefaults = {
  // Renderer
  getDefaultGpuBackend: (): GraphicsApi => DEFAULT_GPU_BACKEND,
  getDefaultResolutionFactor: (): ResolutionFactor => DEFAULT_RESOLUTION_FACTOR,
  getDefaultUseFrameLimit: (): boolean => DEFAULT_USE_FRAME_LIMIT,
  getDefaultFrameLimit: (): number => DEFAULT_FRAME_LIMIT,
  getDefaultTurboLimit: (): number => DEFAULT_TURBO_LIMIT,
  getDefaultUseVsync: (): boolean => DEFAULT_USE_VSYNC,
  getDefaultAsyncShaders: (): boolean => DEFAULT_ASYNC_SHADERS,
  getDefaultAsyncPresentation: (): boolean => DEFAULT_ASYNC_PRESENTATION,
  getDefaultDiskShaderCache: (): boolean => DEFAULT_DISK_SHADER_CACHE,
  getDefaultTextureFilter: (): TextureFilter => DEFAULT_TEXTURE_FILTER,
  getDefaultTextureSampling: (): TextureSampling => DEFAULT_TEXTURE_SAMPLING,
  getDefaultSpirvShaderGen: (): boolean => DEFAULT_SPIRV_SHADER_GEN,
  getDefaultDisableSpirvOptimizer: (): boolean => DEFAULT_DISABLE_SPIRV_OPTIMIZER,
  getDefaultUseHwShader: (): boolean => DEFAULT_USE_HW_SHADER,
  getDefaultShadersAccurateMul: (): boolean => DEFAULT_SHADERS_ACCURATE_MUL,
  getDefaultUseShaderJit: (): boolean => DEFAULT_USE_SHADER_JIT,
  getDefaultDelayGameRenderThreadUs: (): Microseconds0To16000 =>
    DEFAULT_DELAY_GAME_RENDER_THREAD_US,
  getDefaultRender3D: (): StereoRenderOption => DEFAULT_RENDER_3D,
  getDefaultFactor3D: (): StereoscopyFactor => DEFAULT_FACTOR_3D,
  getDefaultMonoRenderOption: (): MonoRenderOption => DEFAULT_MONO_RENDER_OPTION,
  getDefaultFilterMode: (): boolean => DEFAULT_FILTER_MODE,
  getDefaultPpShaderName: (): string => DEFAULT_PP_SHADER_NAME,
  getDefaultAnaglyphShaderName: (): string => DEFAULT_ANAGLYPH_SHADER_NAME,
  getDefaultBgRed: (): NormalizedFloat01 => DEFAULT_BG_RED,
  getDefaultBgGreen: (): NormalizedFloat01 => DEFAULT_BG_GREEN,
  getDefaultBgBlue: (): NormalizedFloat01 => DEFAULT_BG_BLUE,
  getDefaultDisableRightEyeRender: (): boolean => DEFAULT_DISABLE_RIGHT_EYE_RENDER,

  // Audio
  getDefaultAudioVolume: (): NormalizedFloat01 => DEFAULT_AUDIO_VOLUME,
  getDefaultAudioStretching: (): boolean => DEFAULT_AUDIO_STRETCHING,
  getDefaultRealtimeAudio: (): boolean => DEFAULT_REALTIME_AUDIO,
  getDefaultAudioEmulation: (): AudioEmulation => DEFAULT_AUDIO_EMULATION,

  // System
  getDefaultIsNew3ds: (): boolean => DEFAULT_IS_NEW_3DS,
  getDefaultRegionValue: (): RegionValue => DEFAULT_REGION_VALUE,
  getDefaultInitClock: (): InitClock => 0,
  getDefaultInitTime: (): number => 946681277,
  getDefaultInitTicksType: (): InitTicks => 0,
  getDefaultInitTicksOverride: (): number => 0,
  getDefaultPluginLoader: (): boolean => false,
  getDefaultAllowPluginLoader: (): boolean => true,
  getDefaultStepsPerHour: (): number => 0,

  // Layout
  getDefaultAspectRatio: (): AspectRatio => DEFAULT_ASPECT_RATIO,
  getDefaultLayoutOption: (): LayoutOption => DEFAULT_LAYOUT_OPTION,
  getDefaultUprightScreen: (): boolean => DEFAULT_UPRIGHT_SCREEN,
  getDefaultSwapScreen: (): boolean => DEFAULT_SWAP_SCREEN,
  getDefaultSecondaryDisplayLayout: (): SecondaryDisplayLayout => DEFAULT_SECONDARY_DISPLAY_LAYOUT,
  getDefaultPortraitLayoutOption: (): PortraitLayoutOption => DEFAULT_PORTRAIT_LAYOUT_OPTION,
  getDefaultCustomTopX: (): PixelsU16 => DEFAULT_CUSTOM_TOP_X,
  getDefaultCustomTopY: (): PixelsU16 => DEFAULT_CUSTOM_TOP_Y,
  getDefaultCustomTopWidth: (): PixelsU16 => DEFAULT_CUSTOM_TOP_WIDTH,
  getDefaultCustomTopHeight: (): PixelsU16 => DEFAULT_CUSTOM_TOP_HEIGHT,
  getDefaultCustomBottomX: (): PixelsU16 => DEFAULT_CUSTOM_BOTTOM_X,
  getDefaultCustomBottomY: (): PixelsU16 => DEFAULT_CUSTOM_BOTTOM_Y,
  getDefaultCustomBottomWidth: (): PixelsU16 => DEFAULT_CUSTOM_BOTTOM_WIDTH,
  getDefaultCustomBottomHeight: (): PixelsU16 => DEFAULT_CUSTOM_BOTTOM_HEIGHT,
  getDefaultCustomSecondLayerOpacity: (): OpacityPercentU16 => DEFAULT_CUSTOM_SECOND_LAYER_OPACITY,
  getDefaultScreenTopStretch: (): boolean => DEFAULT_SCREEN_TOP_STRETCH,
  getDefaultScreenTopLrPadding: (): PixelsU16 => DEFAULT_SCREEN_TOP_LR_PADDING,
  getDefaultScreenTopTbPadding: (): PixelsU16 => DEFAULT_SCREEN_TOP_TB_PADDING,
  getDefaultScreenBottomStretch: (): boolean => DEFAULT_SCREEN_BOTTOM_STRETCH,
  getDefaultScreenBottomLrPadding: (): PixelsU16 => DEFAULT_SCREEN_BOTTOM_LR_PADDING,
  getDefaultScreenBottomTbPadding: (): PixelsU16 => DEFAULT_SCREEN_BOTTOM_TB_PADDING,
  getDefaultPortraitTopX: (): PixelsU16 => DEFAULT_PORTRAIT_TOP_X,
  getDefaultPortraitTopY: (): PixelsU16 => DEFAULT_PORTRAIT_TOP_Y,
  getDefaultPortraitTopWidth: (): PixelsU16 => DEFAULT_PORTRAIT_TOP_WIDTH,
  getDefaultPortraitTopHeight: (): PixelsU16 => DEFAULT_PORTRAIT_TOP_HEIGHT,
  getDefaultPortraitBottomX: (): PixelsU16 => DEFAULT_PORTRAIT_BOTTOM_X,
  getDefaultPortraitBottomY: (): PixelsU16 => DEFAULT_PORTRAIT_BOTTOM_Y,
  getDefaultPortraitBottomWidth: (): PixelsU16 => DEFAULT_PORTRAIT_BOTTOM_WIDTH,
  getDefaultPortraitBottomHeight: (): PixelsU16 => DEFAULT_PORTRAIT_BOTTOM_HEIGHT,
  getDefaultScreenGap: (): ScreenGap => DEFAULT_SCREEN_GAP,
  getDefaultLargeScreenProportion: (): Float1To16 => DEFAULT_LARGE_SCREEN_PROPORTION,
  getDefaultSmallScreenPosition: (): SmallScreenPosition => DEFAULT_SMALL_SCREEN_POSITION,
}
