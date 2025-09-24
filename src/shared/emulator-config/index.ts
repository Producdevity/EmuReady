import type {
  CustomFieldImportDefinition,
  EmulatorConfigFileType,
  EmulatorConfigImportResult,
  EmulatorConfigMapper,
} from './types'

const mappers = new Map<string, EmulatorConfigMapper>()

export function registerEmulatorConfigMapper(mapper: EmulatorConfigMapper) {
  mappers.set(mapper.slug, mapper)
}

export function getEmulatorConfigMapper(slug: string): EmulatorConfigMapper | undefined {
  return mappers.get(slug)
}

export function parseEmulatorConfig(
  slug: string,
  raw: string,
  fields: CustomFieldImportDefinition[],
): EmulatorConfigImportResult {
  const mapper = mappers.get(slug)
  if (!mapper) {
    return {
      values: [],
      missing: fields.map((field) => field.label),
      warnings: [`No config importer registered for ${slug}.`],
    }
  }

  return mapper.parse(raw, fields)
}

export function getSupportedFileTypes(slug: string): EmulatorConfigFileType[] {
  return mappers.get(slug)?.fileTypes ?? []
}

export type {
  CustomFieldImportDefinition,
  EmulatorConfigImportResult,
  EmulatorConfigMapper,
} from './types'
