/**
 * Eden Emulator Configuration Type Definitions
 *
 * Contains all type definitions for Eden emulator INI configuration files.
 * Each section corresponds to a category in the INI file.
 */

// CPU Backend options
export type CpuBackend = 0 | 1 | 2 // 0: Dynarmic (default), 1: NCE, 2: Software

// CPU Accuracy levels
export type CpuAccuracy = 0 | 1 | 2 // 0: Auto (default), 1: Accurate, 2: Unsafe

// GPU Backend options
export type GpuBackend = 0 | 1 | 3 // 0: OpenGL, 1: Vulkan (default), 3: Null

// Shader Backend options
export type ShaderBackend = 0 | 1 | 2 // 0: GLSL, 1: GLASM, 2: SPIRV (default)

// GPU Accuracy levels
export type GpuAccuracy = 0 | 1 | 2 // 0: Normal (default), 1: High, 2: Extreme

// Resolution scaling options
export type ResolutionSetup = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
// 0: 0.5x, 1: 0.75x, 2: 1x (default), 3: 1.5x, 4: 2x, 5: 3x, 6: 4x, 7: 5x, 8: 6x, 9: 7x, 10: 8x

// Aspect Ratio options
export type AspectRatio = 0 | 1 | 2 | 3 | 4
// 0: Default (16:9), 1: Force 4:3, 2: Force 21:9, 3: Force 16:10, 4: Stretch to Window

// VSync modes
export type VSyncMode = 0 | 1 | 2 | 3
// 0: Immediate (Off), 1: Mailbox, 2: FIFO (VSync) (default), 3: FIFO Relaxed

// NVDEC Emulation options
export type NvdecEmulation = 0 | 1 | 2
// 0: No Video Output, 1: CPU Video Decoding (default), 2: GPU Video Decoding

// ASTC Decode Method
export type AstcDecodeMethod = 0 | 1 // 0: CPU (default), 1: GPU Compute

// ASTC Recompression
export type AstcRecompression = 0 | 1 | 2
// 0: Uncompressed, 1: BC1, 2: BC3 (default)

// Scaling Filter options
export type ScalingFilter = 0 | 1 | 2 | 3 | 4 | 5 | 6
// 0: Nearest, 1: Bilinear (default), 2: Bicubic, 3: Gaussian, 4: ScaleForce, 5: FSR, 6: FXAA

// Anti-Aliasing options
export type AntiAliasing = 0 | 1 | 2 | 3 | 4 | 5
// 0: None (default), 1: FXAA, 2: SMAA Low, 3: SMAA Medium, 4: SMAA High, 5: SMAA Ultra

// Memory Layout modes
export type MemoryLayout = 0 | 1 | 2 | 3
// 0: 4GB (default), 1: 6GB, 2: 8GB, 3: 12GB

// VRAM Usage Mode
export type VramUsageMode = 0 | 1 | 2
// 0: Conservative, 1: Aggressive (default), 2: Extreme

// Audio Output Engine
export type AudioOutputEngine = 0 | 1 | 2 | 3
// 0: Auto (default), 1: Cubeb, 2: SDL2, 3: Null

// Audio Volume (0-100)
export type AudioVolume = number

// Dynamic State modes for Vulkan
export type DynamicState = 0 | 1 | 2 | 3
// 0: Disabled, 1: Dynamic State 1, 2: Dynamic State 2, 3: Dynamic State 3 (all)

// SPIRV Optimization modes
export type OptimizeSpirvOutput = 0 | 1 | 2
// 0: Never, 1: On Load (default), 2: Always

// Max Anisotropy filtering levels
export type MaxAnisotropy = 0 | 1 | 2 | 3 | 4
// 0: Auto/Default, 1: 2x, 2: 4x, 3: 8x, 4: 16x

// Region Index
export type RegionIndex = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6
// -1: Auto (default), 0: Japan, 1: USA, 2: Europe, 3: Australia, 4: China, 5: Korea, 6: Taiwan

// Language Index
export type LanguageIndex =
  | -1
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
// -1: Auto (default), 0-18: Various languages

/**
 * Configuration value with use_global flag
 */
export interface ConfigValue<T> {
  use_global?: boolean
  default?: T
  value?: T
}

export type BooleanConfigValue = ConfigValue<boolean | 0 | 1>
export type IntConfigValue = ConfigValue<number>
export type StringConfigValue = ConfigValue<string>

/**
 * Controls section configuration
 */
export interface ControlsSection {
  vibration_enabled?: BooleanConfigValue
  enable_accurate_vibrations?: BooleanConfigValue
  motion_enabled?: BooleanConfigValue
}

/**
 * Core section configuration
 */
export interface CoreSection {
  use_multi_core?: BooleanConfigValue
  memory_layout_mode?: IntConfigValue
  use_speed_limit?: BooleanConfigValue
  speed_limit?: IntConfigValue
  sync_core_speed?: BooleanConfigValue
}

/**
 * CPU section configuration
 */
export interface CpuSection {
  cpu_backend?: IntConfigValue
  cpu_accuracy?: IntConfigValue
  use_fast_cpu_time?: BooleanConfigValue
  fast_cpu_time?: IntConfigValue
  cpu_debug_mode?: BooleanConfigValue
  cpuopt_fastmem?: BooleanConfigValue
  cpuopt_fastmem_exclusives?: BooleanConfigValue
  cpuopt_unsafe_unfuse_fma?: BooleanConfigValue
  cpuopt_unsafe_reduce_fp_error?: BooleanConfigValue
  cpuopt_unsafe_ignore_standard_fpcr?: BooleanConfigValue
  cpuopt_unsafe_inaccurate_nan?: BooleanConfigValue
  cpuopt_unsafe_fastmem_check?: BooleanConfigValue
  cpuopt_unsafe_ignore_global_monitor?: BooleanConfigValue
  skip_cpu_inner_invalidation?: BooleanConfigValue
  use_custom_cpu_ticks?: BooleanConfigValue
  cpu_ticks?: IntConfigValue
}

/**
 * Renderer/GPU section configuration
 */
export interface RendererSection {
  backend?: IntConfigValue
  shader_backend?: IntConfigValue
  vulkan_device?: IntConfigValue
  frame_interpolation?: BooleanConfigValue
  frame_skipping?: BooleanConfigValue
  use_disk_shader_cache?: BooleanConfigValue
  optimize_spirv_output?: IntConfigValue
  use_asynchronous_gpu_emulation?: BooleanConfigValue
  accelerate_astc?: IntConfigValue
  use_vsync?: IntConfigValue
  nvdec_emulation?: IntConfigValue
  fullscreen_mode?: IntConfigValue
  aspect_ratio?: IntConfigValue
  resolution_setup?: IntConfigValue
  scaling_filter?: IntConfigValue
  anti_aliasing?: IntConfigValue
  fsr_sharpening_slider?: IntConfigValue
  bg_red?: IntConfigValue
  bg_green?: IntConfigValue
  bg_blue?: IntConfigValue
  gpu_accuracy?: IntConfigValue
  max_anisotropy?: IntConfigValue
  astc_recompression?: IntConfigValue
  vram_usage_mode?: IntConfigValue
  async_presentation?: BooleanConfigValue
  force_max_clock?: BooleanConfigValue
  use_reactive_flushing?: BooleanConfigValue
  use_asynchronous_shaders?: BooleanConfigValue
  use_fast_gpu_time?: BooleanConfigValue
  fast_gpu_time?: IntConfigValue
  use_vulkan_driver_pipeline_cache?: BooleanConfigValue
  enable_compute_pipelines?: BooleanConfigValue
  use_video_framerate?: BooleanConfigValue
  barrier_feedback_loops?: BooleanConfigValue
  dyna_state?: IntConfigValue
  provoking_vertex?: BooleanConfigValue
  descriptor_indexing?: BooleanConfigValue
  sample_shading?: BooleanConfigValue
  disable_buffer_reorder?: BooleanConfigValue
}

/**
 * Audio section configuration
 */
export interface AudioSection {
  output_engine?: IntConfigValue
  output_device?: StringConfigValue
  input_device?: StringConfigValue
  volume?: IntConfigValue
  audio_muted?: BooleanConfigValue
}

/**
 * System section configuration
 */
export interface SystemSection {
  use_lru_cache?: BooleanConfigValue
  language_index?: IntConfigValue
  region_index?: IntConfigValue
  time_zone_index?: IntConfigValue
  custom_rtc_enabled?: BooleanConfigValue
  custom_rtc_offset?: IntConfigValue
  rng_seed_enabled?: BooleanConfigValue
  rng_seed?: IntConfigValue
  use_docked_mode?: BooleanConfigValue
  sound_index?: IntConfigValue
}

/**
 * Linux-specific section configuration
 */
export interface LinuxSection {
  enable_gamemode?: BooleanConfigValue
}

/**
 * GPU Driver section configuration
 */
export interface GpuDriverSection {
  driver_path?: StringConfigValue
}

/**
 * Complete Eden configuration interface
 */
export interface EdenConfig {
  Controls?: ControlsSection
  Core?: CoreSection
  Cpu?: CpuSection
  Renderer?: RendererSection
  Audio?: AudioSection
  System?: SystemSection
  Linux?: LinuxSection
  GpuDriver?: GpuDriverSection
}

/**
 * Type guard to check if a value is a valid Eden config section
 */
export type EdenConfigSection = keyof EdenConfig

/**
 * Default configuration values for Eden
 */
export const DEFAULT_CONFIG: Required<EdenConfig> = {
  Controls: {
    vibration_enabled: { use_global: true, value: true },
    enable_accurate_vibrations: { use_global: true, value: false },
    motion_enabled: { use_global: true, value: true },
  },
  Core: {
    use_multi_core: { use_global: true, value: true },
    memory_layout_mode: { use_global: true, value: 0 }, // 4GB
    use_speed_limit: { use_global: true, value: true },
    speed_limit: { use_global: true, value: 100 },
    sync_core_speed: { use_global: true, value: false },
  },
  Cpu: {
    cpu_backend: { use_global: true, value: 0 }, // Dynarmic
    cpu_accuracy: { use_global: true, value: 0 }, // Auto
    use_fast_cpu_time: { use_global: true, value: false },
    fast_cpu_time: { use_global: true, value: 50 },
    cpu_debug_mode: { use_global: true, value: false },
    cpuopt_fastmem: { use_global: true, value: true },
    cpuopt_fastmem_exclusives: { use_global: true, value: true },
    cpuopt_unsafe_unfuse_fma: { use_global: true, value: false },
    cpuopt_unsafe_reduce_fp_error: { use_global: true, value: false },
    cpuopt_unsafe_ignore_standard_fpcr: { use_global: true, value: false },
    cpuopt_unsafe_inaccurate_nan: { use_global: true, value: false },
    cpuopt_unsafe_fastmem_check: { use_global: true, value: false },
    cpuopt_unsafe_ignore_global_monitor: { use_global: true, value: false },
    skip_cpu_inner_invalidation: { use_global: true, value: false },
    use_custom_cpu_ticks: { use_global: true, value: false },
    cpu_ticks: { use_global: true, value: 0 },
  },
  Renderer: {
    backend: { use_global: true, value: 1 }, // Vulkan
    shader_backend: { use_global: true, value: 2 }, // SPIRV
    vulkan_device: { use_global: true, value: 0 },
    frame_interpolation: { use_global: true, value: false },
    frame_skipping: { use_global: true, value: false },
    use_disk_shader_cache: { use_global: true, value: true },
    optimize_spirv_output: { use_global: true, value: 0 },
    use_asynchronous_gpu_emulation: { use_global: true, value: true },
    accelerate_astc: { use_global: true, value: 0 }, // CPU
    use_vsync: { use_global: true, value: 2 }, // FIFO
    nvdec_emulation: { use_global: true, value: 1 }, // CPU decoding
    fullscreen_mode: { use_global: true, value: 0 },
    aspect_ratio: { use_global: true, value: 0 }, // Default 16:9
    resolution_setup: { use_global: true, value: 2 }, // 1x
    scaling_filter: { use_global: true, value: 1 }, // Bilinear
    anti_aliasing: { use_global: true, value: 0 }, // None
    fsr_sharpening_slider: { use_global: true, value: 80 },
    bg_red: { use_global: true, value: 0 },
    bg_green: { use_global: true, value: 0 },
    bg_blue: { use_global: true, value: 0 },
    gpu_accuracy: { use_global: true, value: 0 }, // Normal
    max_anisotropy: { use_global: true, value: 0 },
    astc_recompression: { use_global: true, value: 2 }, // BC3
    vram_usage_mode: { use_global: true, value: 1 }, // Aggressive
    async_presentation: { use_global: true, value: false },
    force_max_clock: { use_global: true, value: false },
    use_reactive_flushing: { use_global: true, value: true },
    use_asynchronous_shaders: { use_global: true, value: false },
    use_fast_gpu_time: { use_global: true, value: false },
    fast_gpu_time: { use_global: true, value: 50 },
    use_vulkan_driver_pipeline_cache: { use_global: true, value: true },
    enable_compute_pipelines: { use_global: true, value: false },
    use_video_framerate: { use_global: true, value: false },
    barrier_feedback_loops: { use_global: true, value: true },
    dyna_state: { use_global: true, value: 0 },
    provoking_vertex: { use_global: true, value: false },
    descriptor_indexing: { use_global: true, value: false },
    sample_shading: { use_global: true, value: false },
    disable_buffer_reorder: { use_global: true, value: false },
  },
  Audio: {
    output_engine: { use_global: true, value: 0 }, // Auto
    output_device: { use_global: true, value: 'auto' },
    input_device: { use_global: true, value: 'auto' },
    volume: { use_global: true, value: 100 },
    audio_muted: { use_global: true, value: false },
  },
  System: {
    use_lru_cache: { use_global: true, value: true },
    language_index: { use_global: true, value: -1 }, // Auto
    region_index: { use_global: true, value: -1 }, // Auto
    time_zone_index: { use_global: true, value: 0 },
    custom_rtc_enabled: { use_global: true, value: false },
    custom_rtc_offset: { use_global: true, value: 0 },
    rng_seed_enabled: { use_global: true, value: false },
    rng_seed: { use_global: true, value: 0 },
    use_docked_mode: { use_global: true, value: true },
    sound_index: { use_global: true, value: 0 },
  },
  Linux: {
    enable_gamemode: { use_global: true, value: false },
  },
  GpuDriver: {
    driver_path: { use_global: true, value: '' },
  },
}
