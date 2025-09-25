import {
  AZAHAR_FIELD_MAPPINGS,
  azaharConfigValueToCustomValue,
  getAzaharDefaultValue,
} from './mapping'
import type { CustomFieldImportDefinition, EmulatorConfigImportResult } from '../types'

interface AzaharIniSections {
  [section: string]: Record<string, string>
}

function parseIni(raw: string): AzaharIniSections {
  const sections: AzaharIniSections = {}
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

export function parseAzaharConfigFromIni(
  raw: string,
  customFields: CustomFieldImportDefinition[],
): EmulatorConfigImportResult {
  const sections = parseIni(raw)

  const values: { id: string; value: unknown }[] = []
  const missing: string[] = []
  const warnings: string[] = []

  for (const field of customFields) {
    const mapping = AZAHAR_FIELD_MAPPINGS[field.name]
    if (!mapping) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else {
        missing.push(field.label)
      }
      continue
    }

    const sectionValues = sections[mapping.section]
    const rawValue = sectionValues?.[mapping.key]

    if (rawValue === undefined) {
      const defaultValue = getAzaharDefaultValue(mapping.key)
      if (defaultValue !== undefined) {
        values.push({ id: field.id, value: defaultValue })
        continue
      }

      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else {
        missing.push(field.label)
      }
      continue
    }

    const parsedValue = azaharConfigValueToCustomValue(mapping.key, parsePrimitive(rawValue))

    if (parsedValue === undefined || parsedValue === null) {
      const defaultValue = getAzaharDefaultValue(mapping.key)
      if (defaultValue !== undefined) {
        values.push({ id: field.id, value: defaultValue })
        continue
      }

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
