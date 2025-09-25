'use client'

import { useCallback, useState } from 'react'
import {
  getEmulatorConfigMapper,
  getSupportedFileTypes,
  parseEmulatorConfig,
  type CustomFieldImportDefinition,
} from '@/shared/emulator-config'
import { CustomFieldType } from '@orm'
import type { CustomFieldDefinitionWithOptions } from '../form-schemas/createDynamicListingSchema'

interface UseEmulatorConfigImporterOptions {
  emulatorSlug: string | null
  fields: CustomFieldDefinitionWithOptions[]
  onResult: (result: {
    values: { id: string; value: unknown }[]
    missing: string[]
    warnings: string[]
  }) => void
}

interface ImporterState {
  isImporting: boolean
  error: string | null
}

interface UseEmulatorConfigImporterResult {
  importFile: (file: File) => Promise<{
    values: { id: string; value: unknown }[]
    missing: string[]
    warnings: string[]
  }>
  isImporting: boolean
  error: string | null
  supportedFileTypes: string[]
}

function mapFieldDefinitions(
  fields: CustomFieldDefinitionWithOptions[],
): CustomFieldImportDefinition[] {
  return fields.map((field) => ({
    id: field.id,
    name: field.name,
    label: field.label,
    type: field.type,
    isRequired: field.isRequired,
    options: field.parsedOptions?.map((opt) => ({ value: opt.value, label: opt.label })),
    defaultValue:
      field.defaultValue === undefined || field.defaultValue === null
        ? undefined
        : field.defaultValue,
  }))
}

export function useEmulatorConfigImporter(
  options: UseEmulatorConfigImporterOptions,
): UseEmulatorConfigImporterResult {
  const [state, setState] = useState<ImporterState>({ isImporting: false, error: null })

  const supportedFileTypes = getSupportedFileTypes(options.emulatorSlug ?? '')

  const importFile = useCallback(
    async (file: File) => {
      if (!options.emulatorSlug) {
        throw new Error('Select an emulator before importing a configuration file.')
      }

      const mapper = getEmulatorConfigMapper(options.emulatorSlug)
      if (!mapper) {
        throw new Error('Configuration importing is not available for this emulator yet.')
      }

      const extension = file.name.split('.').pop()?.toLowerCase()
      const supportedTypes = getSupportedFileTypes(options.emulatorSlug)
      if (supportedTypes.length === 0) {
        throw new Error('Configuration importing is not available for this emulator yet.')
      }

      if (!extension) {
        throw new Error('Unsupported configuration file. Please upload a valid file type.')
      }

      const isSupported = supportedTypes.some((type) => type === extension)
      if (!isSupported) {
        const humanSlug = mapper.slug.charAt(0).toUpperCase() + mapper.slug.slice(1)
        const formattedTypes = supportedTypes
          .map((type) => `.${type}`)
          .join(supportedTypes.length > 1 ? ' or ' : '')
        throw new Error(
          `Only ${humanSlug} ${formattedTypes} configuration files are supported right now.`,
        )
      }

      setState({ isImporting: true, error: null })

      try {
        const text = await file.text()
        const definitions = mapFieldDefinitions(options.fields)
        const result = parseEmulatorConfig(options.emulatorSlug, text, definitions)

        const normalized = {
          values: result.values.map(({ id, value }) => {
            const field = options.fields.find((cf) => cf.id === id)
            if (!field) return { id, value }
            if (field.type === CustomFieldType.BOOLEAN) {
              return { id, value: Boolean(value) }
            }
            if (field.type === CustomFieldType.RANGE && typeof value === 'string') {
              const numeric = Number(value)
              return { id, value: Number.isNaN(numeric) ? value : numeric }
            }
            return { id, value }
          }),
          missing: result.missing,
          warnings: result.warnings,
        }

        options.onResult(normalized)
        return normalized
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Something went wrong while reading the configuration file.'
        setState({ isImporting: false, error: message })
        throw error
      } finally {
        setState((prev) => ({ ...prev, isImporting: false }))
      }
    },
    [options],
  )

  return {
    importFile,
    isImporting: state.isImporting,
    error: state.error,
    supportedFileTypes,
  }
}
