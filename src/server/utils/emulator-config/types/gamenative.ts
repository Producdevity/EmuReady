/**
 * GameNative Container Configuration Type Definitions
 *
 * Contains all type definitions for GameNative container configuration files.
 */

// Screen resolution options
export type ScreenSize =
  | '640x480' // 4:3
  | '800x600' // 4:3
  | '854x480' // 16:9 (default)
  | '960x544' // 16:9
  | '1024x768' // 4:3
  | '1280x720' // 16:9
  | '1280x800' // 16:10
  | '1280x1024' // 5:4
  | '1366x768' // 16:9
  | '1440x900' // 16:10
  | '1600x900' // 16:9
  | '1920x1080' // 16:9
  | string // Custom format: "WIDTHxHEIGHT"

// Graphics driver options
export type GraphicsDriver =
  | 'vortek' // Universal (default) - uses Zink backend
  | 'turnip' // Adreno GPUs - uses Zink + Turnip Vulkan
  | 'virgl' // Universal - uses VirGL

// Graphics driver versions by driver type
export type GraphicsDriverVersions = {
  turnip: '25.1.0' | '25.2.0' | '25.0.0' | '24.1.0'
  virgl: '23.1.9'
  vortek: '2.0'
  zink: '22.2.5' // Used internally by vortek/turnip
}

// DirectX wrapper options
export type DxWrapper =
  | 'dxvk' // DXVK (default)
  | 'vkd3d' // VKD3D
  | 'wined3d' // WineD3D
  | 'cnc-ddraw' // CNC DDraw

// DXVK version options
export type DxvkVersion =
  | '2.6.1-gplasync'
  | '1.10.3'
  | '1.10.9-sarek'
  | '1.9.2'
  | '2.3.1'
  | '2.4-gplasync'
  | 'async-1.10.3'

// Audio driver options
export type AudioDriver =
  | 'alsa' // ALSA (default)
  | 'pulse' // PulseAudio

// Video memory size options
export type VideoMemorySize =
  | '32' // 32 MB
  | '64' // 64 MB
  | '128' // 128 MB
  | '256' // 256 MB
  | '512' // 512 MB
  | '1024' // 1024 MB
  | '2048' // 2048 MB (default)
  | '4096' // 4096 MB
  | '6144' // 6144 MB
  | '8192' // 8192 MB
  | '10240' // 10240 MB
  | '12288' // 12288 MB

// Box86/64 performance presets
export type Box86_64Preset =
  | 'STABILITY'
  | 'COMPATIBILITY' // Default
  | 'INTERMEDIATE'
  | 'PERFORMANCE'
  | string // Custom presets start with "CUSTOM-"

// Box86/64 version options
export type Box86Version = '0.3.2' | '0.3.7'
export type Box64Version = '0.3.6' | '0.3.4'

// Startup selection modes
export type StartupSelection =
  | 0 // Normal (Load all services)
  | 1 // Essential (Load only essential services) - Default
  | 2 // Aggressive (Stop services on startup)

// Wine desktop theme options
export type DesktopTheme = 'LIGHT' | 'DARK'

// Wine desktop background type
export type DesktopBackgroundType =
  | 'IMAGE' // Default
  | 'COLOR'

// Off-screen rendering modes
export type OffScreenRenderingMode =
  | 'fbo' // FBO (default)
  | 'backbuffer' // Backbuffer

// Mouse warp override options
export type MouseWarpOverride =
  | 'disable' // Disable (default)
  | 'enable' // Enable
  | 'force' // Force

// DirectInput mapper type
export type DinputMapperType =
  | 0 // Standard (Old Gamepads)
  | 1 // XInput (default)

// Shader backend options
export type ShaderBackend = 'glsl'

// Wine component configuration
export type WinComponents = string

// Environment variables
export type EnvVars = string

// CPU list format
export type CpuList = string

/**
 * Complete container configuration interface
 */
export interface ContainerConfig {
  /** Container name */
  name?: string

  /** Screen resolution */
  screenSize?: ScreenSize

  /** Environment variables */
  envVars?: EnvVars

  /** Graphics driver */
  graphicsDriver?: GraphicsDriver

  /** Graphics driver version */
  graphicsDriverVersion?: string

  /** DirectX wrapper */
  dxwrapper?: DxWrapper

  /** DirectX wrapper configuration */
  dxwrapperConfig?: string

  /** DXVK version */
  dxvkVersion?: DxvkVersion

  /** Audio driver */
  audioDriver?: AudioDriver

  /** Windows components configuration */
  wincomponents?: WinComponents

  /** Execution arguments */
  execArgs?: string

  /** Executable path */
  executablePath?: string

  /** Show FPS overlay */
  showFPS?: boolean

  /** Launch real Steam client */
  launchRealSteam?: boolean

  /** CPU core list */
  cpuList?: CpuList

  /** CPU core list for WoW64 */
  cpuListWoW64?: CpuList

  /** Enable WoW64 mode */
  wow64Mode?: boolean

  /** Startup selection mode */
  startupSelection?: StartupSelection

  /** Box86 version */
  box86Version?: Box86Version

  /** Box64 version */
  box64Version?: Box64Version

  /** Box86 performance preset */
  box86Preset?: Box86_64Preset

  /** Box64 performance preset */
  box64Preset?: Box86_64Preset

  /**
   * Desktop theme configuration
   * Format: "THEME,BACKGROUND_TYPE,COLOR"
   *
   * Examples:
   * - "LIGHT,IMAGE,#0277bd" (default)
   * - "DARK,COLOR,#000000"
   * - "LIGHT,COLOR,#ffffff"
   */
  desktopTheme?: string

  /** Enable SDL controller API */
  sdlControllerAPI?: boolean

  /** Enable XInput support */
  enableXInput?: boolean

  /** Enable DirectInput support */
  enableDInput?: boolean

  /** DirectInput mapper type */
  dinputMapperType?: DinputMapperType

  /** Disable mouse input */
  disableMouseInput?: boolean

  /** Enable Command Stream Multithreading */
  csmt?: boolean

  /**
   * Video PCI device ID for GPU emulation
   * Default: 1728 (NVIDIA GeForce GTX 480)
   */
  videoPciDeviceID?: number

  /** Off-screen rendering mode */
  offScreenRenderingMode?: OffScreenRenderingMode

  /** Enable strict shader math */
  strictShaderMath?: boolean

  /** Video memory size in MB */
  videoMemorySize?: VideoMemorySize

  /** Mouse warp override setting */
  mouseWarpOverride?: MouseWarpOverride

  /** Shader backend */
  shaderBackend?: ShaderBackend

  /** Use GLSL shaders */
  useGLSL?: 'enabled' | 'disabled'
}

/**
 * Helper type for graphics driver version based on selected driver
 */
export type GraphicsDriverVersionFor<T extends GraphicsDriver> = T extends 'turnip'
  ? GraphicsDriverVersions['turnip']
  : T extends 'virgl'
    ? GraphicsDriverVersions['virgl']
    : T extends 'vortek'
      ? GraphicsDriverVersions['vortek']
      : string

/**
 * Default configuration values (from GameNative)
 */
export const DEFAULT_CONFIG: Required<ContainerConfig> = {
  name: '',
  screenSize: '854x480',
  envVars:
    'ZINK_DESCRIPTORS=lazy ZINK_DEBUG=compact MESA_SHADER_CACHE_DISABLE=false MESA_SHADER_CACHE_MAX_SIZE=512MB mesa_glthread=true WINEESYNC=1 MESA_VK_WSI_PRESENT_MODE=mailbox TU_DEBUG=noconform',
  graphicsDriver: 'vortek',
  graphicsDriverVersion: '',
  dxwrapper: 'dxvk',
  dxvkVersion: '2.6.1-gplasync',
  dxwrapperConfig: '',
  audioDriver: 'alsa',
  wincomponents:
    'direct3d=1,directsound=1,directmusic=0,directshow=0,directplay=0,vcrun2010=1,wmdecoder=1',
  execArgs: '',
  executablePath: '',
  showFPS: false,
  launchRealSteam: false,
  cpuList: '0,1,2,3,4,5,6,7', // Dynamic: matches Runtime.getRuntime().availableProcessors()
  cpuListWoW64: '0,1,2,3,4,5,6,7', // Same as cpuList
  wow64Mode: true,
  startupSelection: 1, // STARTUP_SELECTION_ESSENTIAL
  box86Version: '0.3.2',
  box64Version: '0.3.6',
  box86Preset: 'COMPATIBILITY',
  box64Preset: 'COMPATIBILITY',
  desktopTheme: 'LIGHT,IMAGE,#0277bd',
  sdlControllerAPI: true,
  enableXInput: true,
  enableDInput: true,
  dinputMapperType: 1,
  disableMouseInput: false,
  csmt: true,
  videoPciDeviceID: 1728,
  offScreenRenderingMode: 'fbo',
  strictShaderMath: true,
  videoMemorySize: '2048',
  mouseWarpOverride: 'disable',
  shaderBackend: 'glsl',
  useGLSL: 'enabled',
}
