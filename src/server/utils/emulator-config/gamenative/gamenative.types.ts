/**
 * GameNative Container Configuration Type Definitions
 *
 * Source of truth: ContainerData.kt, Container.java, DefaultVersion.java, arrays.xml
 */

export type ScreenSize =
  | '640x480' // 4:3
  | '800x600' // 4:3
  | '854x480' // 16:9 (default)
  | '960x540' // 16:9
  | '1024x768' // 4:3
  | '1280x720' // 16:9
  | '1280x800' // 16:10
  | '1280x1024' // 5:4
  | '1366x768' // 16:9
  | '1440x900' // 16:10
  | '1600x900' // 16:9
  | '1920x1080' // 16:9
  | string // Custom format: "WIDTHxHEIGHT"

export type GraphicsDriver =
  | 'vortek'
  | 'turnip'
  | 'virgl'
  | 'adreno'
  | 'sd-8-elite'
  | 'wrapper'
  | 'wrapper-v2'
  | 'wrapper-leegao'
  | 'wrapper-legacy'

export type GraphicsDriverVersions = {
  turnip: '25.1.0' | '25.2.0' | '25.3.0' | '25.0.0' | '24.1.0'
  virgl: '23.1.9'
  vortek: '2.1'
  zink: '22.2.5'
  adreno: '819.2' | '805'
  sd8elite: '800.51' | '2-842.6'
}

export type DxWrapper = 'dxvk' | 'vkd3d' | 'wined3d' | 'cnc-ddraw'

export type DxvkVersion =
  | 'async-1.10.3'
  | '2.7.1'
  | '1.10.3'
  | '1.10.1'
  | '1.10.9-sarek'
  | '1.11.1-sarek'
  | '1.9.2'
  | '2.3.1'
  | '2.4-gplasync'
  | '2.4.1'
  | '2.4.1-gplasync'
  | '2.6.1-gplasync'
  | '2.6-arm64ec'

export type VKD3DVersion = '2.6' | '2.12' | '2.13' | '2.14.1' | '3.0b'

export type AudioDriver = 'alsa' | 'pulseaudio'

export type VideoMemorySize =
  | '32'
  | '64'
  | '128'
  | '256'
  | '512'
  | '1024'
  | '2048'
  | '4096'
  | '6144'
  | '8192'
  | '10240'
  | '12288'

export type Box86_64Preset =
  | 'STABILITY'
  | 'COMPATIBILITY'
  | 'INTERMEDIATE'
  | 'PERFORMANCE'
  | 'DENUVO'
  | 'UNITY'
  | 'UNITY_MONO_BLEEDING_EDGE'
  | 'CUSTOM'
  | string

export type Box86Version = '0.3.2' | '0.3.7'
export type Box64Version = '0.3.2' | '0.3.4' | '0.3.6' | '0.3.7' | '0.3.8' | '0.4.0'

export type FEXCorePreset =
  | 'STABILITY'
  | 'COMPATIBILITY'
  | 'INTERMEDIATE'
  | 'PERFORMANCE'
  | 'EXTREME'
  | 'DENUVO'
  | 'CUSTOM'
  | string

export type FEXCoreVersion = '2507' | '2508' | '2511' | '2512' | '2601' | '2603'

export type FEXCoreTSOMode = 'Fast' | 'Slow'
export type FEXCoreX87Mode = 'Fast' | 'Slow'
export type FEXCoreMultiBlock = 'Enabled' | 'Disabled'

export type Emulator = 'FEXCore' | 'Box64'

export type ContainerVariant = 'glibc' | 'bionic'

export type SteamType = 'normal' | 'light' | 'ultralight'

export type ExternalDisplayMode = 'off' | 'touchpad' | 'keyboard' | 'hybrid'

export type SharpnessEffect = 'None' | 'CAS' | 'DLS'

export type StartupSelection = 0 | 1 | 2

export type DesktopTheme = 'LIGHT' | 'DARK'

export type DesktopBackgroundType = 'IMAGE' | 'COLOR'

export type OffScreenRenderingMode = 'fbo' | 'backbuffer'

export type MouseWarpOverride = 'disable' | 'enable' | 'force'

export type DinputMapperType = 1 | 2

export type ShaderBackend = 'glsl'

export type WinComponents = string
export type EnvVars = string
export type CpuList = string

export type VulkanVersion = '1.1' | '1.2' | '1.3'
export type BcnEmulation = 'none' | 'partial' | 'full' | 'auto'
export type BcnEmulationType = 'software' | 'compute'
export type PresentMode = 'mailbox' | 'fifo' | 'immediate' | 'relaxed'
export type ResourceType = 'auto' | 'dmabuf' | 'ahb' | 'opaque'

export interface DxWrapperConfig {
  version?: DxvkVersion
  framerate?: number
  maxDeviceMemory?: number
  async?: '0' | '1'
  asyncCache?: '0' | '1'
  vkd3dVersion?: VKD3DVersion
  vkd3dLevel?: string
  ddrawrapper?: 'none' | string
  csmt?: number
  gpuName?: string
  videoMemorySize?: string
  strict_shader_math?: '0' | '1'
  OffscreenRenderingMode?: OffScreenRenderingMode
  renderer?: string
}

export interface GraphicsDriverConfig {
  vulkanVersion?: VulkanVersion
  version?: string
  blacklistedExtensions?: string
  maxDeviceMemory?: number
  presentMode?: PresentMode
  syncFrame?: '0' | '1'
  disablePresentWait?: '0' | '1'
  resourceType?: ResourceType
  bcnEmulation?: BcnEmulation
  bcnEmulationType?: BcnEmulationType
  bcnEmulationCache?: '0' | '1'
  gpuName?: string
  adrenotoolsTurnip?: '0' | '1'
}

export interface ContainerConfig {
  name?: string
  screenSize?: ScreenSize
  envVars?: EnvVars
  graphicsDriver?: GraphicsDriver
  graphicsDriverVersion?: string
  graphicsDriverConfig?: string
  dxwrapper?: DxWrapper
  dxwrapperConfig?: string
  audioDriver?: AudioDriver
  wincomponents?: WinComponents
  drives?: string
  execArgs?: string
  executablePath?: string
  installPath?: string
  showFPS?: boolean
  launchRealSteam?: boolean
  allowSteamUpdates?: boolean
  steamType?: SteamType
  cpuList?: CpuList
  cpuListWoW64?: CpuList
  wow64Mode?: boolean
  startupSelection?: StartupSelection
  box86Version?: Box86Version
  box64Version?: Box64Version
  box86Preset?: Box86_64Preset
  box64Preset?: Box86_64Preset
  desktopTheme?: string
  containerVariant?: ContainerVariant
  wineVersion?: string
  emulator?: Emulator
  fexcoreVersion?: FEXCoreVersion | string
  fexcoreTSOMode?: FEXCoreTSOMode
  fexcoreX87Mode?: FEXCoreX87Mode
  fexcoreMultiBlock?: FEXCoreMultiBlock
  fexcorePreset?: FEXCorePreset
  renderer?: string
  csmt?: boolean
  videoPciDeviceID?: number
  offScreenRenderingMode?: OffScreenRenderingMode
  strictShaderMath?: boolean
  useDRI3?: boolean
  videoMemorySize?: VideoMemorySize
  mouseWarpOverride?: MouseWarpOverride
  shaderBackend?: ShaderBackend
  useGLSL?: 'enabled' | 'disabled'
  sdlControllerAPI?: boolean
  useSteamInput?: boolean
  enableXInput?: boolean
  enableDInput?: boolean
  dinputMapperType?: DinputMapperType
  disableMouseInput?: boolean
  touchscreenMode?: boolean
  shooterMode?: boolean
  gestureConfig?: string
  externalDisplayMode?: ExternalDisplayMode
  externalDisplaySwap?: boolean
  language?: string
  forceDlc?: boolean
  steamOfflineMode?: boolean
  useLegacyDRM?: boolean
  unpackFiles?: boolean
  portraitMode?: boolean
  sharpnessEffect?: SharpnessEffect
  sharpnessLevel?: number
  sharpnessDenoise?: number
}

export type GraphicsDriverVersionFor<T extends GraphicsDriver> = T extends 'turnip'
  ? GraphicsDriverVersions['turnip']
  : T extends 'virgl'
    ? GraphicsDriverVersions['virgl']
    : T extends 'vortek'
      ? GraphicsDriverVersions['vortek']
      : T extends 'adreno'
        ? GraphicsDriverVersions['adreno']
        : T extends 'sd-8-elite'
          ? GraphicsDriverVersions['sd8elite']
          : string
