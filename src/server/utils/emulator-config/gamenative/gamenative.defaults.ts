/**
 * GameNative Configuration Defaults
 *
 * Source of truth: ContainerData.kt defaults, Container.java constants,
 * DefaultVersion.java, arrays.xml
 */

import type {
  GraphicsDriver,
  DxWrapper,
  AudioDriver,
  StartupSelection,
  Box86Version,
  Box64Version,
  Box86_64Preset,
  ScreenSize,
  DxvkVersion,
  VKD3DVersion,
  ContainerConfig,
  Emulator,
  ContainerVariant,
  SteamType,
  FEXCorePreset,
  FEXCoreVersion,
  ExternalDisplayMode,
  SharpnessEffect,
} from './gamenative.types'

export const DEFAULT_ENV_VARS =
  'WRAPPER_MAX_IMAGE_COUNT=0 ZINK_DESCRIPTORS=lazy ZINK_DEBUG=compact MESA_SHADER_CACHE_DISABLE=false MESA_SHADER_CACHE_MAX_SIZE=512MB mesa_glthread=true WINEESYNC=1 MESA_VK_WSI_PRESENT_MODE=mailbox TU_DEBUG=noconform DXVK_FRAME_RATE=60 PULSE_LATENCY_MSEC=144'

export const DEFAULT_SCREEN_SIZE: ScreenSize = '1280x720'

export const DEFAULT_GRAPHICS_DRIVER: GraphicsDriver = 'vortek'

export const GRAPHICS_DRIVER_MAPPING: Record<string, GraphicsDriver> = {
  'VirGL (Universal)': 'virgl',
  'Turnip (Adreno)': 'turnip',
  'Vortek (Universal)': 'vortek',
  'Adreno (Adreno)': 'adreno',
  'SD 8 Elite (SD 8 Elite)': 'sd-8-elite',
  Wrapper: 'wrapper',
  'Wrapper-v2': 'wrapper-v2',
  'Wrapper-leegao': 'wrapper-leegao',
  'Wrapper-legacy': 'wrapper-legacy',
  virgl: 'virgl',
  turnip: 'turnip',
  vortek: 'vortek',
  adreno: 'adreno',
  'sd-8-elite': 'sd-8-elite',
  wrapper: 'wrapper',
  'wrapper-v2': 'wrapper-v2',
  'wrapper-leegao': 'wrapper-leegao',
  'wrapper-legacy': 'wrapper-legacy',
  VirGL: 'virgl',
  Turnip: 'turnip',
  Vortek: 'vortek',
  VIRGL: 'virgl',
  TURNIP: 'turnip',
  VORTEK: 'vortek',
}

export const DEFAULT_DX_WRAPPER: DxWrapper = 'dxvk'

export const DEFAULT_DXVK_VERSION: DxvkVersion = '2.6.1-gplasync'

export const DEFAULT_VKD3D_VERSION: VKD3DVersion = '2.14.1'

export const DEFAULT_AUDIO_DRIVER: AudioDriver = 'pulseaudio'

export const DEFAULT_STARTUP_SELECTION: StartupSelection = 1

export const DEFAULT_BOX64_VERSION: Box64Version = '0.3.6'
export const DEFAULT_BOX86_VERSION: Box86Version = '0.3.2'

export const DEFAULT_BOX_PRESET: Box86_64Preset = 'COMPATIBILITY'

export const DEFAULT_EMULATOR: Emulator = 'FEXCore'

export const DEFAULT_CONTAINER_VARIANT: ContainerVariant = 'glibc'

export const DEFAULT_STEAM_TYPE: SteamType = 'normal'

export const DEFAULT_FEXCORE_VERSION: FEXCoreVersion = '2603'
export const DEFAULT_FEXCORE_PRESET: FEXCorePreset = 'INTERMEDIATE'
export const DEFAULT_FEXCORE_TSO_MODE = 'Fast'
export const DEFAULT_FEXCORE_X87_MODE = 'Fast'
export const DEFAULT_FEXCORE_MULTIBLOCK = 'Disabled'

export const DEFAULT_WINE_VERSION = 'wine-9.2-x86_64'

export const DEFAULT_EXTERNAL_DISPLAY_MODE: ExternalDisplayMode = 'off'

export const DEFAULT_SHARPNESS_EFFECT: SharpnessEffect = 'None'
export const DEFAULT_SHARPNESS_LEVEL = 100
export const DEFAULT_SHARPNESS_DENOISE = 100

export const DEFAULT_VIDEO_MEMORY_SIZE = '2048'

export const DEFAULT_CPU_LIST = '0,1,2,3,4,5,6,7'

export const DEFAULT_VIDEO_PCI_DEVICE_ID = 1728

export const DEFAULT_OFFSCREEN_RENDERING_MODE = 'fbo'

export const DEFAULT_MOUSE_WARP_OVERRIDE = 'disable'

export const DEFAULT_SHADER_BACKEND = 'glsl'

export const DEFAULT_USE_GLSL = 'enabled'

export const DEFAULT_RENDERER = 'gl'

export const VALID_VIDEO_MEMORY_SIZES = [
  '32',
  '64',
  '128',
  '256',
  '512',
  '1024',
  '2048',
  '4096',
  '6144',
  '8192',
  '10240',
  '12288',
]

export const VALID_OFFSCREEN_RENDERING_MODES = ['fbo', 'backbuffer']

export const VALID_MOUSE_WARP_OVERRIDE_MODES = ['disable', 'enable', 'force']

export const VALID_USE_GLSL_VALUES = ['enabled', 'disabled']

export const DEFAULT_WINDOWS_COMPONENTS = {
  direct3d: true,
  directsound: true,
  directmusic: false,
  directshow: false,
  directplay: false,
  vcrun2010: true,
  wmdecoder: true,
  opengl: false,
}

export const DX_WRAPPER_MAPPING: Record<string, DxWrapper> = {
  WineD3D: 'wined3d',
  DXVK: 'dxvk',
  VKD3D: 'vkd3d',
  'CNC DDraw': 'cnc-ddraw',
  Other: 'dxvk',
}

export const AUDIO_DRIVER_MAPPING: Record<string, AudioDriver> = {
  alsa: 'alsa',
  pulse: 'pulseaudio',
  other: 'pulseaudio',
  // Legacy/display label variants for backward compatibility
  ALSA: 'alsa',
  PulseAudio: 'pulseaudio',
  Other: 'pulseaudio',
}

export const STARTUP_SELECTION_MAPPING: Record<string, StartupSelection> = {
  'Normal (Load all services)': 0,
  'Essential (Load only essential services)': 1,
  'Aggressive (Stop services on startup)': 2,
  Other: 1,
}

export const BOX64_PRESET_MAPPING: Record<string, Box86_64Preset> = {
  stability: 'STABILITY',
  compatibility: 'COMPATIBILITY',
  intermediate: 'INTERMEDIATE',
  performance: 'PERFORMANCE',
  denuvo: 'DENUVO',
  unity: 'UNITY',
  unity_mono_bleeding_edge: 'UNITY_MONO_BLEEDING_EDGE',
  other: 'COMPATIBILITY',
  'other/custom': 'COMPATIBILITY',
  Stability: 'STABILITY',
  Compatibility: 'COMPATIBILITY',
  Intermediate: 'INTERMEDIATE',
  Performance: 'PERFORMANCE',
  Denuvo: 'DENUVO',
  Unity: 'UNITY',
  'Unity Mono Bleeding Edge': 'UNITY_MONO_BLEEDING_EDGE',
  'Other/Custom': 'COMPATIBILITY',
}

export const BOX86_PRESET_MAPPING: Record<string, Box86_64Preset> = {
  stability: 'STABILITY',
  compatibility: 'COMPATIBILITY',
  intermediate: 'INTERMEDIATE',
  performance: 'PERFORMANCE',
  denuvo: 'DENUVO',
  unity: 'UNITY',
  unity_mono_bleeding_edge: 'UNITY_MONO_BLEEDING_EDGE',
  'other/custom': 'COMPATIBILITY',
  Stability: 'STABILITY',
  Compatibility: 'COMPATIBILITY',
  Intermediate: 'INTERMEDIATE',
  Performance: 'PERFORMANCE',
  Denuvo: 'DENUVO',
  Unity: 'UNITY',
  'Unity Mono Bleeding Edge': 'UNITY_MONO_BLEEDING_EDGE',
  'Other/Custom': 'COMPATIBILITY',
}

export const EMULATOR_MAPPING: Record<string, Emulator> = {
  FEXCore: 'FEXCore',
  Box64: 'Box64',
  fex: 'FEXCore',
  box: 'Box64',
  Other: 'FEXCore',
}

export const CONTAINER_VARIANT_MAPPING: Record<string, ContainerVariant> = {
  glibc: 'glibc',
  bionic: 'bionic',
  Other: 'glibc',
}

export const STEAM_TYPE_MAPPING: Record<string, SteamType> = {
  normal: 'normal',
  light: 'light',
  ultralight: 'ultralight',
  ultra_light: 'ultralight',
  Normal: 'normal',
  Light: 'light',
  Ultralight: 'ultralight',
  Other: 'normal',
}

export const FEXCORE_PRESET_MAPPING: Record<string, FEXCorePreset> = {
  stability: 'STABILITY',
  compatibility: 'COMPATIBILITY',
  intermediate: 'INTERMEDIATE',
  performance: 'PERFORMANCE',
  extreme: 'EXTREME',
  denuvo: 'DENUVO',
  other: 'INTERMEDIATE',
  'other/custom': 'INTERMEDIATE',
  Stability: 'STABILITY',
  Compatibility: 'COMPATIBILITY',
  Intermediate: 'INTERMEDIATE',
  Performance: 'PERFORMANCE',
  Extreme: 'EXTREME',
  Denuvo: 'DENUVO',
  'Other/Custom': 'INTERMEDIATE',
}

export const EXTERNAL_DISPLAY_MODE_MAPPING: Record<string, ExternalDisplayMode> = {
  off: 'off',
  touchpad: 'touchpad',
  keyboard: 'keyboard',
  hybrid: 'hybrid',
  Off: 'off',
  Touchpad: 'touchpad',
  Keyboard: 'keyboard',
  Hybrid: 'hybrid',
  Other: 'off',
}

export const SHARPNESS_EFFECT_MAPPING: Record<string, SharpnessEffect> = {
  None: 'None',
  CAS: 'CAS',
  DLS: 'DLS',
  Other: 'None',
}

const VALID_DXVK_VERSIONS: DxvkVersion[] = [
  'async-1.10.3',
  '2.7.1',
  '1.10.3',
  '1.10.1',
  '1.10.9-sarek',
  '1.11.1-sarek',
  '1.9.2',
  '2.3.1',
  '2.4-gplasync',
  '2.4.1',
  '2.4.1-gplasync',
  '2.6.1-gplasync',
  '2.6-arm64ec',
]

const VALID_VKD3D_VERSIONS: VKD3DVersion[] = ['2.6', '2.12', '2.13', '2.14.1', '3.0b']

const VALID_BOX64_ALL_VERSIONS: Box64Version[] = [
  '0.3.2',
  '0.3.4',
  '0.3.6',
  '0.3.7',
  '0.3.8',
  '0.4.0',
]

const VALID_FEXCORE_VERSIONS: FEXCoreVersion[] = ['2507', '2508', '2511', '2512', '2601', '2603']

export const DEFAULT_CONFIG: Required<ContainerConfig> = {
  name: '',
  screenSize: '1280x720',
  envVars:
    'WRAPPER_MAX_IMAGE_COUNT=0 ZINK_DESCRIPTORS=lazy ZINK_DEBUG=compact MESA_SHADER_CACHE_DISABLE=false MESA_SHADER_CACHE_MAX_SIZE=512MB mesa_glthread=true WINEESYNC=1 MESA_VK_WSI_PRESENT_MODE=mailbox TU_DEBUG=noconform DXVK_FRAME_RATE=60 PULSE_LATENCY_MSEC=144',
  graphicsDriver: 'vortek',
  graphicsDriverVersion: '',
  graphicsDriverConfig: '',
  dxwrapper: 'dxvk',
  dxwrapperConfig: '',
  audioDriver: 'pulseaudio',
  wincomponents:
    'direct3d=1,directsound=1,directmusic=0,directshow=0,directplay=0,vcrun2010=1,wmdecoder=1,opengl=0',
  drives: '',
  execArgs: '',
  executablePath: '',
  installPath: '',
  showFPS: false,
  launchRealSteam: false,
  allowSteamUpdates: false,
  steamType: 'normal',
  cpuList: '0,1,2,3,4,5,6,7',
  cpuListWoW64: '0,1,2,3,4,5,6,7',
  wow64Mode: true,
  startupSelection: 1,
  box86Version: '0.3.2',
  box64Version: '0.3.6',
  box86Preset: 'COMPATIBILITY',
  box64Preset: 'COMPATIBILITY',
  desktopTheme: 'LIGHT,IMAGE,#0277bd',
  containerVariant: 'glibc',
  wineVersion: 'wine-9.2-x86_64',
  emulator: 'FEXCore',
  fexcoreVersion: '2603',
  fexcoreTSOMode: 'Fast',
  fexcoreX87Mode: 'Fast',
  fexcoreMultiBlock: 'Disabled',
  fexcorePreset: 'INTERMEDIATE',
  renderer: 'gl',
  csmt: true,
  videoPciDeviceID: 1728,
  offScreenRenderingMode: 'fbo',
  strictShaderMath: true,
  useDRI3: true,
  videoMemorySize: '2048',
  mouseWarpOverride: 'disable',
  shaderBackend: 'glsl',
  useGLSL: 'enabled',
  sdlControllerAPI: true,
  useSteamInput: false,
  enableXInput: true,
  enableDInput: true,
  dinputMapperType: 1,
  disableMouseInput: false,
  touchscreenMode: false,
  shooterMode: true,
  gestureConfig: '',
  externalDisplayMode: 'off',
  externalDisplaySwap: false,
  language: 'english',
  forceDlc: false,
  steamOfflineMode: false,
  useLegacyDRM: false,
  unpackFiles: false,
  portraitMode: false,
  sharpnessEffect: 'None',
  sharpnessLevel: 100,
  sharpnessDenoise: 100,
}

export const GameNativeDefaults = {
  getDefaultEnvVars: (): string => DEFAULT_ENV_VARS,
  getDefaultScreenSize: (): ScreenSize => DEFAULT_SCREEN_SIZE,
  getDefaultGraphicsDriver: (): GraphicsDriver => DEFAULT_GRAPHICS_DRIVER,
  getDefaultDxWrapper: (): DxWrapper => DEFAULT_DX_WRAPPER,
  getDefaultDxvkVersion: (): DxvkVersion => DEFAULT_DXVK_VERSION,
  getDefaultAudioDriver: (): AudioDriver => DEFAULT_AUDIO_DRIVER,
  getDefaultStartupSelection: (): StartupSelection => DEFAULT_STARTUP_SELECTION,
  getDefaultBox64Version: (): Box64Version => DEFAULT_BOX64_VERSION,
  getDefaultBox86Version: (): Box86Version => DEFAULT_BOX86_VERSION,
  getDefaultBoxPreset: (): Box86_64Preset => DEFAULT_BOX_PRESET,
  getDefaultEmulator: (): Emulator => DEFAULT_EMULATOR,
  getDefaultContainerVariant: (): ContainerVariant => DEFAULT_CONTAINER_VARIANT,
  getDefaultSteamType: (): SteamType => DEFAULT_STEAM_TYPE,
  getDefaultFexcoreVersion: (): FEXCoreVersion => DEFAULT_FEXCORE_VERSION,
  getDefaultFexcorePreset: (): FEXCorePreset => DEFAULT_FEXCORE_PRESET,
  getDefaultVideoMemorySize: (): string => DEFAULT_VIDEO_MEMORY_SIZE,
  getDefaultCpuList: (): string => DEFAULT_CPU_LIST,
  getDefaultVideoPciDeviceId: (): number => DEFAULT_VIDEO_PCI_DEVICE_ID,
  getDefaultOffscreenRenderingMode: (): string => DEFAULT_OFFSCREEN_RENDERING_MODE,
  getDefaultMouseWarpOverride: (): string => DEFAULT_MOUSE_WARP_OVERRIDE,
  getDefaultShaderBackend: (): string => DEFAULT_SHADER_BACKEND,
  getDefaultUseGlsl: (): string => DEFAULT_USE_GLSL,
  getDefaultWindowsComponents: () => ({ ...DEFAULT_WINDOWS_COMPONENTS }),

  isValidVideoMemorySize: (size: string): boolean => VALID_VIDEO_MEMORY_SIZES.includes(size),
  isValidOffscreenRenderingMode: (mode: string): boolean =>
    VALID_OFFSCREEN_RENDERING_MODES.includes(mode.toLowerCase()),
  isValidMouseWarpOverride: (mode: string): boolean =>
    VALID_MOUSE_WARP_OVERRIDE_MODES.includes(mode.toLowerCase()),
  isValidUseGlsl: (value: string): boolean => VALID_USE_GLSL_VALUES.includes(value.toLowerCase()),
  isValidBox64Version: (version: string): version is Box64Version =>
    VALID_BOX64_ALL_VERSIONS.some((v) => v === version),
  isValidBox86Version: (version: string): version is Box86Version =>
    version === '0.3.2' || version === '0.3.7',
  isValidDxvkVersion: (version: string): version is DxvkVersion =>
    VALID_DXVK_VERSIONS.some((v) => v === version),
  isValidVkd3dVersion: (version: string): version is VKD3DVersion =>
    VALID_VKD3D_VERSIONS.some((v) => v === version),
  isValidFexcoreVersion: (version: string): version is FEXCoreVersion =>
    VALID_FEXCORE_VERSIONS.some((v) => v === version),
  isValidEmulator: (value: string): value is Emulator => value === 'FEXCore' || value === 'Box64',
  isValidContainerVariant: (value: string): value is ContainerVariant =>
    value === 'glibc' || value === 'bionic',

  detectGraphicsDriver: (value: string): GraphicsDriver => {
    if (!value) return DEFAULT_GRAPHICS_DRIVER

    const cleanValue = value.trim()

    if (GRAPHICS_DRIVER_MAPPING[cleanValue]) return GRAPHICS_DRIVER_MAPPING[cleanValue]

    const normalizedValue = cleanValue.toLowerCase()

    for (const [key, driver] of Object.entries(GRAPHICS_DRIVER_MAPPING)) {
      if (key.toLowerCase() === normalizedValue) return driver
    }

    if (normalizedValue.includes('sd-8-elite') || normalizedValue.includes('sd 8 elite')) {
      return 'sd-8-elite'
    }
    if (normalizedValue.includes('wrapper-leegao')) return 'wrapper-leegao'
    if (normalizedValue.includes('wrapper-legacy')) return 'wrapper-legacy'
    if (normalizedValue.includes('wrapper-v2')) return 'wrapper-v2'
    if (normalizedValue.includes('wrapper')) return 'wrapper'
    if (normalizedValue.includes('turnip')) return 'turnip'
    if (normalizedValue.includes('adreno')) return 'adreno'
    if (normalizedValue.includes('virgl')) return 'virgl'
    if (normalizedValue.includes('vortek')) return 'vortek'

    return DEFAULT_GRAPHICS_DRIVER
  },
}
