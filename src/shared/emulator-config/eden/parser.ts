import { DEFAULT_CONFIG } from '@/server/utils/emulator-config/eden/eden.defaults'
import { EDEN_FIELD_MAPPINGS, edenConfigValueToCustomValue } from './mapping'
import type { CustomFieldImportDefinition, EmulatorConfigImportResult } from '../types'
import type { EdenConfig, ResolutionSetup } from '@/server/utils/emulator-config/eden/eden.types'

interface EdenIniSections {
  [section: string]: Record<string, string>
}

function cloneDefaultConfig(): EdenConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as EdenConfig
}

function parseIni(raw: string): EdenIniSections {
  const sections: EdenIniSections = {}
  let currentSection = 'Global'

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.startsWith(';') || trimmed.startsWith('#')) return

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1).trim()
      if (!sections[currentSection]) sections[currentSection] = {}
      return
    }

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) return

    const key = trimmed.slice(0, equalsIndex).trim()
    const value = trimmed.slice(equalsIndex + 1).trim()

    if (!sections[currentSection]) sections[currentSection] = {}
    sections[currentSection][key] = value
  })

  return sections
}

function parsePrimitive(value: string): string | number | boolean {
  const lower = value.toLowerCase()
  if (lower === 'true') return true
  if (lower === 'false') return false

  const num = Number(value)
  return Number.isNaN(num) ? value : num
}

function applySectionEntries(
  config: EdenConfig,
  sectionName: string,
  entries: Record<string, string>,
) {
  const section = config[sectionName as keyof EdenConfig]
  if (!section || typeof section !== 'object') return

  for (const [rawKey, rawValue] of Object.entries(entries)) {
    const [baseKey, modifier] = rawKey.split('\\')
    const configEntry = section[baseKey as keyof typeof section]

    if (!configEntry || typeof configEntry !== 'object') continue

    if (modifier === 'use_global') {
      if ('use_global' in configEntry) {
        ;(configEntry as { use_global: boolean }).use_global = rawValue === 'true'
      }
      continue
    }

    if (modifier === 'default') {
      if ('default' in configEntry) {
        ;(configEntry as { default: unknown }).default = parsePrimitive(rawValue)
      }
      continue
    }

    if ('value' in configEntry) {
      ;(configEntry as { value: unknown }).value = parsePrimitive(rawValue)
    }
  }
}

function buildConfigFromIni(raw: string): EdenConfig {
  const config = cloneDefaultConfig()
  const sections = parseIni(raw)

  for (const [sectionName, entries] of Object.entries(sections)) {
    applySectionEntries(config, sectionName, entries)
  }

  return config
}

/**
 * A direct lookup array to map a ResolutionSetup number to its string representation.
 * These values are chosen to be representative of the ranges in the original parser.
 */
const MULTIPLIER_VALUES: string[] = [
  '0.5x', // Corresponds to 0
  '0.75x', // Corresponds to 1
  '1.0x', // Corresponds to 2
  '1.5x', // Corresponds to 3
  '2.0x', // Corresponds to 4
  '3.0x', // Corresponds to 5
  '4.0x', // Corresponds to 6
  '5.0x', // Corresponds to 7
  '6.0x', // Corresponds to 8
  '7.0x', // Corresponds to 9
  '8.0x', // Corresponds to 10
]

/**
 * Formats a ResolutionSetup number into its corresponding multiplier string (e.g., 1 -> '0.75x').
 * @param setup The numeric resolution setup value (0-10).
 * @returns The multiplier as a string with an 'x' suffix.
 */
const parseResolutionMultiplier = (setup: ResolutionSetup): string => {
  // Return the string from the lookup array or default to '1.0x' if out of bounds.
  return MULTIPLIER_VALUES[setup] || '1.0x'
}

export function parseEdenConfigFromIni(
  raw: string,
  customFields: CustomFieldImportDefinition[],
): EmulatorConfigImportResult {
  const config = buildConfigFromIni(raw)

  const values: { id: string; value: unknown }[] = []
  const missing: string[] = []
  const warnings: string[] = []

  for (const field of customFields) {
    const mapping = EDEN_FIELD_MAPPINGS[field.name]
    if (!mapping) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else if (field.isRequired) {
        missing.push(field.label)
      }
      continue
    }

    const section = config[mapping.section]
    const entry = section?.[mapping.key as keyof typeof section]

    if (!entry || typeof entry !== 'object' || !('value' in entry)) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else if (field.isRequired) {
        missing.push(field.label)
      }
      continue
    }

    const rawValue = (entry as { value: unknown }).value

    if (mapping.key === 'driver_path') {
      // Special handling: extract filename from absolute path and pass it through.
      // The form component will reconcile this filename with the fetched driver list
      // and replace it with the canonical option value.
      const str = String(rawValue ?? '')
      const filename = str.split('/').pop() || str
      if (filename) {
        values.push({ id: field.id, value: filename })
      } else if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else if (field.isRequired) {
        missing.push(field.label)
      }
      continue
    }

    if (mapping.key === 'resolution_setup') {
      if (typeof rawValue === 'number') {
        const value = parseResolutionMultiplier(rawValue as ResolutionSetup)
        values.push({ id: field.id, value })
      } else if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else if (field.isRequired) {
        missing.push(field.label)
      }
      continue
    }

    const parsedValue = edenConfigValueToCustomValue(mapping.key, rawValue)
    if (parsedValue === undefined) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else if (field.isRequired) {
        missing.push(field.label)
      }
      continue
    }

    values.push({ id: field.id, value: parsedValue })
  }

  return { values, missing, warnings }
}
