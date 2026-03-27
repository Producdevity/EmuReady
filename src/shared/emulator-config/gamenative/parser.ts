import { GAMENATIVE_IMPORT_MAPPINGS } from './mapping'
import type { CustomFieldImportDefinition, EmulatorConfigImportResult } from '../types'

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

export function parseGameNativeConfigFromJson(
  raw: string,
  customFields: CustomFieldImportDefinition[],
): EmulatorConfigImportResult {
  const values: { id: string; value: unknown }[] = []
  const missing: string[] = []
  const warnings: string[] = []

  let config: Record<string, unknown>
  try {
    config = JSON.parse(raw) as Record<string, unknown>
  } catch {
    warnings.push('Failed to parse JSON configuration file.')
    return { values, missing, warnings }
  }

  if (typeof config !== 'object' || config === null) {
    warnings.push('Configuration file does not contain a valid JSON object.')
    return { values, missing, warnings }
  }

  for (const field of customFields) {
    const mapping = GAMENATIVE_IMPORT_MAPPINGS[field.name]
    if (!mapping) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else if (field.isRequired) {
        missing.push(field.label)
      }
      continue
    }

    const paths = Array.isArray(mapping.jsonPath) ? mapping.jsonPath : [mapping.jsonPath]
    let rawValue: unknown
    let found = false

    for (const path of paths) {
      rawValue = getNestedValue(config, path)
      if (rawValue !== undefined) {
        found = true
        break
      }
    }

    if (!found) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values.push({ id: field.id, value: field.defaultValue })
      } else if (field.isRequired) {
        missing.push(field.label)
      }
      continue
    }

    const value = mapping.fromConfig ? mapping.fromConfig(rawValue, config) : rawValue
    values.push({ id: field.id, value })
  }

  return { values, missing, warnings }
}
