import {
  AzaharDefaults,
  GPU_BACKEND_MAPPING,
  RESOLUTION_FACTOR_MAPPING,
} from '@/server/utils/emulator-config/azahar/azahar.defaults'
import type {
  GraphicsApi,
  LayoutOption,
  Microseconds0To16000,
  ResolutionFactor,
  StereoRenderOption,
  TextureFilter,
  TextureSampling,
} from '@/server/utils/emulator-config/azahar/azahar.types'

export const TEXTURE_FILTER_MAPPING: Record<string, TextureFilter> = {
  None: 0,
  'No Filter': 0,
  Anime4K: 1,
  Bicubic: 2,
  ScaleForce: 3,
  xBRZ: 4,
  MMPX: 5,
}

export const TEXTURE_SAMPLING_MAPPING: Record<string, TextureSampling> = {
  'Game Controlled': 0,
  GameControlled: 0,
  'Nearest Neighbor': 1,
  Nearest: 1,
  Linear: 2,
}

export const LAYOUT_OPTION_MAPPING: Record<string, LayoutOption> = {
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

export const STEREO_RENDER_MODE_MAPPING: Record<string, StereoRenderOption> = {
  Off: 0,
  'Side by Side': 1,
  'Reverse Side by Side': 2,
  Anaglyph: 3,
  Interlaced: 4,
  'Reverse Interlaced': 5,
  'Cardboard VR': 6,
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

export function toGraphicsApi(value: unknown): GraphicsApi | undefined {
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

export function fromGraphicsApi(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return undefined

  if (numeric === GPU_BACKEND_MAPPING.OpenGLES) return 'OpenGLES'

  const entry = Object.entries(GPU_BACKEND_MAPPING).find(([, mapped]) => mapped === numeric)
  if (entry) {
    const [label] = entry
    return label
  }

  return undefined
}

export function toResolutionFactor(value: unknown): ResolutionFactor | undefined {
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

export function fromResolutionFactor(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return undefined
  if (numeric === 0) return 'auto'
  if (numeric === 1) return 'native'
  return String(numeric)
}

export function toDelayGameRenderThread(value: unknown): Microseconds0To16000 | undefined {
  if (value === null || value === undefined) return undefined

  const numeric = Number(value)
  if (Number.isNaN(numeric)) return undefined

  const clamped = Math.max(0, Math.min(100, Math.round(numeric)))

  return (clamped * 100) as Microseconds0To16000
}

export function fromDelayGameRenderThread(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined

  const numeric = Number(value)
  if (Number.isNaN(numeric)) return undefined

  return Math.round(numeric / 100)
}

export function toBoolean(value: unknown): boolean | undefined {
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

// Removed redundant fromBoolean; use toBoolean for both directions.

function fromDictionaryValue<T>(dictionary: Record<string, T>, value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const numeric = Number(value)
  if (Number.isNaN(numeric)) {
    const raw = String(value).trim()
    if (raw === '') return undefined
    return Object.keys(dictionary).find((key) => key.toLowerCase() === raw.toLowerCase())
  }

  for (const [key, mappedValue] of Object.entries(dictionary)) {
    if (mappedValue === numeric) return key
  }

  return undefined
}

export function mapTextureFilter(value: unknown): TextureFilter | undefined {
  return mapFromDictionary(TEXTURE_FILTER_MAPPING, value)
}

export function mapTextureSampling(value: unknown): TextureSampling | undefined {
  return mapFromDictionary(TEXTURE_SAMPLING_MAPPING, value)
}

export function mapLayoutOption(value: unknown): LayoutOption | undefined {
  return mapFromDictionary(LAYOUT_OPTION_MAPPING, value)
}

export function mapStereoRenderOption(value: unknown): StereoRenderOption | undefined {
  return mapFromDictionary(STEREO_RENDER_MODE_MAPPING, value)
}

export function fromTextureFilter(value: unknown): string | undefined {
  return fromDictionaryValue(TEXTURE_FILTER_MAPPING, value)
}

export function fromTextureSampling(value: unknown): string | undefined {
  return fromDictionaryValue(TEXTURE_SAMPLING_MAPPING, value)
}

export function fromLayoutOption(value: unknown): string | undefined {
  return fromDictionaryValue(LAYOUT_OPTION_MAPPING, value)
}

export function fromStereoRenderOption(value: unknown): string | undefined {
  return fromDictionaryValue(STEREO_RENDER_MODE_MAPPING, value)
}
