/**
 * Azahar Emulator Configuration Type Definitions
 *
 * Defines TypeScript types that mirror Azahar's Android INI configuration
 * sections and keys. Each section corresponds to a group in the INI file.
 */

// Graphics backend
// Graphics API (matches Settings::GraphicsAPI)
// 0: Software, 1: OpenGL, 2: Vulkan
export type GraphicsApi = 0 | 1 | 2

// Texture filter
// 0: NoFilter, 1: Anime4K, 2: Bicubic, 3: ScaleForce, 4: xBRZ, 5: MMPX
export type TextureFilter = 0 | 1 | 2 | 3 | 4 | 5

// Texture sampling
// 0: GameControlled, 1: NearestNeighbor, 2: Linear
export type TextureSampling = 0 | 1 | 2

// Stereoscopy
// 0: Off, 1: SideBySide, 2: ReverseSideBySide, 3: Anaglyph, 4: Interlaced, 5: ReverseInterlaced, 6: CardboardVR
export type StereoRenderOption = 0 | 1 | 2 | 3 | 4 | 5 | 6
// Mono render option (when 3D is off): 0 LeftEye, 1 RightEye
export type MonoRenderOption = 0 | 1

// Layout options (Android — no SeparateWindows)
// 0 Default, 1 SingleScreen, 2 LargeScreen, 3 SideScreen, 4 HybridScreen, 5 CustomLayout
export type LayoutOption = 0 | 1 | 2 | 3 | 4 | 5
// Portrait layout
// 0 PortraitTopFullWidth, 1 PortraitCustomLayout, 2 PortraitOriginal
export type PortraitLayoutOption = 0 | 1 | 2
// Secondary display layout
// 0 None, 1 TopScreenOnly, 2 BottomScreenOnly, 3 SideBySide
export type SecondaryDisplayLayout = 0 | 1 | 2 | 3

// Aspect ratio
// 0 Default, 1 16:9, 2 4:3, 3 21:9, 4 16:10, 5 Stretch
export type AspectRatio = 0 | 1 | 2 | 3 | 4 | 5

// Audio emulation: 0 HLE, 1 LLE, 2 LLEMultithreaded
export type AudioEmulation = 0 | 1 | 2

// Internal resolution multiplier (matches Azahar's 0..10 range)
export type ResolutionFactor = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

// Domain aliases for clarity (numeric ranges not enforced by TS)
export type NormalizedFloat01 = number // 0.0 .. 1.0
export type Percent0To1000 = number // 0 .. 1000 (percent)
export type Microseconds0To16000 = number // 0 .. 16000
export type EpochSecondsU64 = number // u64 seconds since epoch
export type StepsPerHourU16 = number // 0 .. 65535
export type PixelsU16 = number // 0 .. 65535
export type OpacityPercentU16 = number // 0 .. 100
export type Float1To16 = number // 1.0 .. 16.0
export type TicksS64 = number
export type ShaderName = string
export type RegionValue = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6
export type InitClock = 0 | 1 // SystemTime(0), FixedTime(1)
export type InitTicks = 0 | 1 // Random(0), Fixed(1)
export type StereoscopyFactor = number // u32, implementation-defined range
export type ScreenGap = number // s32, implementation-defined range

// Generic config value wrapper (optional; mirrors "use_global" concepts if needed later)
export interface ConfigValue<T> {
  value?: T
}

export type BoolValue = ConfigValue<boolean>
export type IntValue = ConfigValue<number>
export type StringValue = ConfigValue<string>

/**
 * Renderer section (INI: [Renderer])
 */
export interface RendererSection {
  graphics_api?: ConfigValue<GraphicsApi> // 0 Software, 1 OpenGL, 2 Vulkan
  resolution_factor?: ConfigValue<ResolutionFactor> // 0..10 (0 auto, 1=1x .. 10=10x)
  use_frame_limit?: BoolValue // boolean
  frame_limit?: ConfigValue<Percent0To1000> // 0..1000
  turbo_limit?: ConfigValue<Percent0To1000> // 0..1000
  use_vsync_new?: BoolValue // boolean
  texture_filter?: ConfigValue<TextureFilter>
  texture_sampling?: ConfigValue<TextureSampling>
  spirv_shader_gen?: BoolValue
  disable_spirv_optimizer?: BoolValue
  async_shader_compilation?: BoolValue
  async_presentation?: BoolValue
  use_hw_shader?: BoolValue
  use_disk_shader_cache?: BoolValue
  shaders_accurate_mul?: BoolValue
  use_shader_jit?: BoolValue
  delay_game_render_thread_us?: ConfigValue<Microseconds0To16000> // 0..16000
  render_3d?: ConfigValue<StereoRenderOption>
  factor_3d?: ConfigValue<StereoscopyFactor> // u32
  mono_render_option?: ConfigValue<MonoRenderOption>
  filter_mode?: BoolValue
  pp_shader_name?: ConfigValue<ShaderName>
  anaglyph_shader_name?: ConfigValue<ShaderName>
  bg_red?: ConfigValue<NormalizedFloat01>
  bg_green?: ConfigValue<NormalizedFloat01>
  bg_blue?: ConfigValue<NormalizedFloat01>
  disable_right_eye_render?: BoolValue
}

/**
 * Audio section (INI: [Audio])
 */
export interface AudioSection {
  audio_emulation?: ConfigValue<AudioEmulation>
  volume?: ConfigValue<NormalizedFloat01> // 0.0..1.0
  enable_audio_stretching?: BoolValue
  enable_realtime_audio?: BoolValue
}

/**
 * System section (INI: [System])
 */
export interface SystemSection {
  is_new_3ds?: BoolValue // boolean
  region_value?: ConfigValue<RegionValue> // -1 auto, 0..6
  lle_applets?: BoolValue
  enable_required_online_lle_modules?: BoolValue
  init_clock?: ConfigValue<InitClock> // 0 SystemTime, 1 FixedTime
  init_time?: ConfigValue<EpochSecondsU64> // seconds since epoch
  init_ticks_type?: ConfigValue<InitTicks> // 0 Random, 1 Fixed
  init_ticks_override?: ConfigValue<TicksS64> // s64
  plugin_loader?: BoolValue // plugin_loader_enabled
  allow_plugin_loader?: BoolValue
  steps_per_hour?: ConfigValue<StepsPerHourU16>
}

/**
 * Layout section (INI: [Layout])
 */
export interface LayoutSection {
  aspect_ratio?: ConfigValue<AspectRatio>
  layout_option?: ConfigValue<LayoutOption>
  upright_screen?: BoolValue
  swap_screen?: BoolValue
  secondary_display_layout?: ConfigValue<SecondaryDisplayLayout>
  // Landscape custom
  custom_top_x?: ConfigValue<PixelsU16>
  custom_top_y?: ConfigValue<PixelsU16>
  custom_top_width?: ConfigValue<PixelsU16>
  custom_top_height?: ConfigValue<PixelsU16>
  custom_bottom_x?: ConfigValue<PixelsU16>
  custom_bottom_y?: ConfigValue<PixelsU16>
  custom_bottom_width?: ConfigValue<PixelsU16>
  custom_bottom_height?: ConfigValue<PixelsU16>
  custom_second_layer_opacity?: ConfigValue<OpacityPercentU16>
  screen_top_stretch?: BoolValue
  screen_top_leftright_padding?: ConfigValue<PixelsU16>
  screen_top_topbottom_padding?: ConfigValue<PixelsU16>
  screen_bottom_stretch?: BoolValue
  screen_bottom_leftright_padding?: ConfigValue<PixelsU16>
  screen_bottom_topbottom_padding?: ConfigValue<PixelsU16>
  // Portrait custom
  portrait_layout_option?: ConfigValue<PortraitLayoutOption>
  custom_portrait_top_x?: ConfigValue<PixelsU16>
  custom_portrait_top_y?: ConfigValue<PixelsU16>
  custom_portrait_top_width?: ConfigValue<PixelsU16>
  custom_portrait_top_height?: ConfigValue<PixelsU16>
  custom_portrait_bottom_x?: ConfigValue<PixelsU16>
  custom_portrait_bottom_y?: ConfigValue<PixelsU16>
  custom_portrait_bottom_width?: ConfigValue<PixelsU16>
  custom_portrait_bottom_height?: ConfigValue<PixelsU16>
  // Misc
  screen_gap?: ConfigValue<ScreenGap>
  large_screen_proportion?: ConfigValue<Float1To16>
  small_screen_position?: ConfigValue<SmallScreenPosition> // (0..7)

  // Cardboard VR (if used)
  cardboard_screen_size?: ConfigValue<number> // 30..100 (percent)
  cardboard_x_shift?: ConfigValue<number> // -100..100
  cardboard_y_shift?: ConfigValue<number> // -100..100
}

// Small screen position relative to large (0..7)
export type SmallScreenPosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

/**
 * Complete Azahar configuration interface (per-game overrides)
 */
export interface AzaharConfig {
  Renderer?: RendererSection
  Audio?: AudioSection
  System?: SystemSection
  Layout?: LayoutSection
  // Optional additional groups
  Utility?: {
    dump_textures?: BoolValue
    custom_textures?: BoolValue
    preload_textures?: BoolValue
    async_custom_loading?: BoolValue
  }
  Storage?: {
    compress_cia_installs?: BoolValue
  }
  Debugging?: {
    record_frame_times?: BoolValue
    renderer_debug?: BoolValue
    use_gdbstub?: BoolValue
    gdbstub_port?: IntValue
    instant_debug_log?: BoolValue
    enable_rpc_server?: BoolValue
  }
  Miscellaneous?: {
    log_filter?: StringValue
    log_regex_filter?: StringValue
  }
}

export type AzaharConfigSection = keyof AzaharConfig
