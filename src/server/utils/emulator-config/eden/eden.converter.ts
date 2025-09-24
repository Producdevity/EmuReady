/**
 * Eden Emulator Configuration Converter
 * Converts listing data with custom field values to Eden .ini format
 */

import { applyEdenMapping, EDEN_FIELD_MAPPINGS } from '@/shared/emulator-config/eden/mapping'
import { EdenDefaults, DEFAULT_CONFIG } from './eden.defaults'
import type {
  EdenConfig,
  BooleanConfigValue,
  IntConfigValue,
  StringConfigValue,
  ResolutionSetup,
} from './eden.types'
import type { Prisma } from '@orm'

// Constants
const EDEN_ANDROID_BASE_PATH =
  '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers'

function transformDriverValue(value: unknown): string | undefined {
  const driverString = String(value).trim()

  if (EdenDefaults.isNoDriverValue(driverString)) return undefined

  if (driverString.includes('|||')) {
    const parts = driverString.split('|||')
    const displayPart = parts[0]
    const filenamePart = parts[1]

    if (filenamePart && filenamePart.trim() !== '') {
      let filename = filenamePart.trim()
      if (filename.endsWith('.adpkg') && !filename.endsWith('.adpkg.zip')) {
        filename = `${filename}.zip`
      }
      return `${EDEN_ANDROID_BASE_PATH}/${filename}`
    }

    const bracketMatch = displayPart.match(/\]\s*(.+\.adpkg)/i)
    return bracketMatch && bracketMatch[1]
      ? `${EDEN_ANDROID_BASE_PATH}/${bracketMatch[1]}.zip`
      : `${EDEN_ANDROID_BASE_PATH}/${displayPart}.adpkg.zip`
  }

  try {
    const parsed = JSON.parse(driverString)
    if (typeof parsed === 'object' && parsed !== null) {
      if (
        'filename' in parsed &&
        typeof parsed.filename === 'string' &&
        parsed.filename.trim() !== ''
      ) {
        let filename = parsed.filename
        if (filename.endsWith('.adpkg') && !filename.endsWith('.adpkg.zip')) {
          filename = `${filename}.zip`
        }
        return `${EDEN_ANDROID_BASE_PATH}/${filename}`
      }
      if ('display' in parsed && typeof parsed.display === 'string') {
        const displayName = parsed.display || driverString
        const bracketMatch = displayName.match(/\]\s*(.+\.adpkg)/i)
        if (bracketMatch && bracketMatch[1]) {
          return `${EDEN_ANDROID_BASE_PATH}/${bracketMatch[1]}.zip`
        }
        return `${EDEN_ANDROID_BASE_PATH}/${displayName}.adpkg.zip`
      }
    }
  } catch {
    // Non-JSON input is expected for legacy driver values.
  }

  const bracketMatch = driverString.match(/\]\s*(.+\.adpkg)/i)
  if (bracketMatch && bracketMatch[1]) {
    return `${EDEN_ANDROID_BASE_PATH}/${bracketMatch[1]}.zip`
  }

  if (driverString.toLowerCase().endsWith('.adpkg')) {
    const filename = driverString.split('/').pop() || driverString
    return `${EDEN_ANDROID_BASE_PATH}/${filename}.zip`
  }

  if (driverString.startsWith('/') && driverString.includes('gpu_drivers')) {
    return driverString
  }

  if (EdenDefaults.isCommonDriverName(driverString)) {
    return `${EDEN_ANDROID_BASE_PATH}/${driverString}.adpkg.zip`
  }

  return undefined
}

export interface CustomFieldValue {
  customFieldDefinition: {
    name: string
    label: string
    type: string
    options?: Prisma.JsonValue | null
  }
  value: Prisma.JsonValue
}

export interface EdenConfigInput {
  listingId: string
  gameId: string
  customFieldValues: CustomFieldValue[]
}

/**
 * Maps custom field names to Eden .ini keys and sections
 */
/**
 * Parse resolution value with support for multipliers and pixel formats
 * @param value
 */
function resolutionParser(value: unknown): ResolutionSetup | undefined {
  const resStr = String(value)

  // First try using the helper function
  const multiplierResult = EdenDefaults.parseResolutionMultiplier(resStr)
  if (multiplierResult !== null) return multiplierResult

  // Check for pixel resolution patterns (e.g., "1280x720", "720p", "1080p")
  if (EdenDefaults.isPixelResolution(resStr)) {
    // These are pixel resolutions, not multipliers - default to native
    return EdenDefaults.getDefaultResolutionSetup()
  }

  // If it's a pure number (no 'x' or other characters), use it
  const trimmed = resStr.trim()
  if (/^\d+$/.test(trimmed)) {
    const directNumber = parseInt(trimmed, 10)
    if (!isNaN(directNumber) && directNumber >= 0 && directNumber <= 10) {
      return directNumber as ResolutionSetup
    }
  }

  // Default to native resolution
  return EdenDefaults.getDefaultResolutionSetup()
}

/**
 * Get default Eden configuration with deep copy to avoid shared state
 */
function getDefaultConfig(): EdenConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as EdenConfig
}

/**
 * Convert listing data to Eden configuration
 */
export function convertToEdenConfig(input: EdenConfigInput): EdenConfig {
  // Validate input
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: expected an object')
  }

  if (!Array.isArray(input.customFieldValues)) {
    throw new Error('Invalid input: customFieldValues must be an array')
  }

  const config = getDefaultConfig()

  // Process each custom field value
  for (const fieldValue of input.customFieldValues) {
    // Validate field value structure
    if (!fieldValue || typeof fieldValue !== 'object') continue // Skip invalid field values

    if (!fieldValue.customFieldDefinition || typeof fieldValue.customFieldDefinition !== 'object') {
      continue // Skip if missing definition
    }
    const fieldName = fieldValue.customFieldDefinition.name
    const mapping = EDEN_FIELD_MAPPINGS[fieldName]

    if (mapping) {
      if (mapping.key === 'driver_path') {
        const driverPath = transformDriverValue(fieldValue.value)
        if (driverPath !== undefined) {
          applyEdenMapping(config, mapping, driverPath)
        }
        continue
      }

      let valueToApply: unknown = fieldValue.value

      if (
        mapping.key === 'resolution_setup' &&
        (fieldName === 'resolution' || fieldName === 'rosolution')
      ) {
        valueToApply = resolutionParser(fieldValue.value)
      }

      if (valueToApply === undefined) continue
      applyEdenMapping(config, mapping, valueToApply)
    }
  }

  const fastCpuTime = input.customFieldValues.find(
    (v) => v.customFieldDefinition.name === 'fast_cpu_time',
  )
  if (fastCpuTime && config.Cpu) {
    const boolValue = Boolean(fastCpuTime.value)
    const numValue = boolValue ? 1 : 0
    if (config.Cpu.use_fast_cpu_time) {
      config.Cpu.use_fast_cpu_time.default = false
      config.Cpu.use_fast_cpu_time.value = boolValue
      config.Cpu.use_fast_cpu_time.use_global = false
    }
    if (config.Cpu.fast_cpu_time) {
      config.Cpu.fast_cpu_time.default = 0 // Use 0 for numeric config values
      config.Cpu.fast_cpu_time.value = numValue
      config.Cpu.fast_cpu_time.use_global = false
    }
  }

  const fastGpuTime = input.customFieldValues.find(
    (v) => v.customFieldDefinition.name === 'use_fast_gpu_time',
  )
  if (fastGpuTime && config.Renderer) {
    const boolValue = Boolean(fastGpuTime.value)
    const numValue = boolValue ? 1 : 0
    if (config.Renderer.use_fast_gpu_time) {
      config.Renderer.use_fast_gpu_time.default = false
      config.Renderer.use_fast_gpu_time.value = boolValue
      config.Renderer.use_fast_gpu_time.use_global = false
    }
    if (config.Renderer.fast_gpu_time) {
      config.Renderer.fast_gpu_time.default = 0 // Use 0 for numeric config values
      config.Renderer.fast_gpu_time.value = numValue
      config.Renderer.fast_gpu_time.use_global = false
    }
  }

  return config
}

/**
 * Serialize Eden configuration to .ini format
 */
export function serializeEdenConfig(config: EdenConfig): string {
  const lines: string[] = []
  const sectionOrder: (keyof EdenConfig)[] = [
    'Controls',
    'Core',
    'Cpu',
    'Renderer',
    'Audio',
    'System',
    'Linux',
    'GpuDriver',
  ]

  for (const sectionName of sectionOrder) {
    const section = config[sectionName]
    if (!section || Object.keys(section).length === 0) continue

    lines.push(`[${sectionName}]`)

    for (const [key, setting] of Object.entries(section)) {
      if (setting === null || setting === undefined) continue

      const configValue = setting as BooleanConfigValue | IntConfigValue | StringConfigValue

      if (configValue.use_global !== undefined) {
        lines.push(`${key}\\use_global=${configValue.use_global ? 'true' : 'false'}`)
      }

      if (configValue.default !== undefined) {
        const defaultValue = formatIniValue(configValue.default)
        lines.push(`${key}\\default=${defaultValue}`)
      }

      if (key === 'driver_path' && configValue.use_global === true && configValue.value === '') {
      } else if (configValue.value !== undefined) {
        const value = formatIniValue(configValue.value)
        lines.push(`${key}=${value}`)
      }
    }

    lines.push('')
    lines.push('')
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()

  return lines.join('\n')
}

/**
 * Format a value for INI output
 */
function formatIniValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  } else if (typeof value === 'number') {
    return String(value)
  } else if (typeof value === 'string') {
    return value.replace(/[\r\n]/g, '')
  } else if (value === null || value === undefined) {
    return ''
  } else {
    return String(value)
  }
}
