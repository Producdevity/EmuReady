import { type CustomFieldType } from '@orm'

export interface CustomFieldOptionImport {
  value: string
  label: string
}

export interface CustomFieldImportDefinition {
  id: string
  name: string
  label: string
  type: CustomFieldType
  isRequired: boolean
  options?: CustomFieldOptionImport[]
  defaultValue?: string | number | boolean | null
}

export interface EmulatorConfigImportResult {
  values: { id: string; value: unknown }[]
  missing: string[]
  warnings: string[]
}

export type EmulatorConfigFileType = 'ini' | 'json'

export interface EmulatorConfigMapper {
  slug: string
  fileTypes: EmulatorConfigFileType[]
  parse(raw: string, fields: CustomFieldImportDefinition[]): EmulatorConfigImportResult
}
