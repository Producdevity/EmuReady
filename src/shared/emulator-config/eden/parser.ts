import { DEFAULT_CONFIG } from '@/server/utils/emulator-config/eden/eden.defaults'
import { EDEN_FIELD_MAPPINGS, edenConfigValueToCustomValue } from './mapping'
import type { CustomFieldImportDefinition, EmulatorConfigImportResult } from '../types'
import type { EdenConfig } from '@/server/utils/emulator-config/eden/eden.types'

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
      } else {
        missing.push(field.label)
      }
      continue
    }

    const section = config[mapping.section]
    const entry = section?.[mapping.key as keyof typeof section]

    if (!entry || typeof entry !== 'object' || !('value' in entry)) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else {
        missing.push(field.label)
      }
      continue
    }

    const rawValue = (entry as { value: unknown }).value

    if (mapping.key === 'driver_path') {
      missing.push(field.label)
      continue
    }

    if (mapping.key === 'resolution_setup') {
      if (typeof rawValue === 'number') {
        values.push({ id: field.id, value: rawValue })
      } else if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else {
        missing.push(field.label)
      }
      continue
    }

    const parsedValue = edenConfigValueToCustomValue(mapping.key, rawValue)
    if (parsedValue === undefined) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else {
        missing.push(field.label)
      }
      continue
    }

    values.push({ id: field.id, value: parsedValue })
  }

  return { values, missing, warnings }
}
