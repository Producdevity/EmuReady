import { type z } from 'zod'
import { type CreateListingBaseSchema } from '@/schemas/listingCreate'
import {
  isCustomFieldValueValid,
  type CustomFieldDefinitionWithOptions,
} from '@/utils/custom-field-validation'
import {
  getCustomFieldDefaultValue,
  isCustomFieldValueEmpty,
  parseCustomFieldOptions,
} from '@/utils/custom-fields'
import { CustomFieldType } from '@orm'
import { SavedEmulatorSettingSchema, type LastEmulatorSettingsSchema } from './settings.schemas'

export type SubmittedSettings = z.input<typeof CreateListingBaseSchema>['customFieldValues']

export function createLastEmulatorSettings(values: SubmittedSettings) {
  return {
    version: 1 as const,
    values: (values ?? []).flatMap((entry) => {
      const parsed = SavedEmulatorSettingSchema.safeParse(entry)
      return parsed.success && !isCustomFieldValueEmpty(parsed.data.value) ? [parsed.data] : []
    }),
  }
}

export function getReusableEmulatorSettings(
  snapshot: z.output<typeof LastEmulatorSettingsSchema>,
  fields: readonly CustomFieldDefinitionWithOptions[],
) {
  const saved = new Map(snapshot?.values.map((entry) => [entry.customFieldDefinitionId, entry]))
  return fields.flatMap((field) => {
    const entry = saved.get(field.id)
    if (!entry || isCustomFieldValueEmpty(entry.value)) return []
    if (
      field.type === CustomFieldType.SELECT &&
      !(field.parsedOptions ?? parseCustomFieldOptions(field))?.length
    )
      return []
    return isCustomFieldValueValid(field, entry.value) ? [entry] : []
  })
}

export function hasCustomSettingsDraft(
  values: SubmittedSettings,
  fields: readonly CustomFieldDefinitionWithOptions[],
) {
  const current = new Map(values?.map((entry) => [entry.customFieldDefinitionId, entry.value]))
  return fields.some(
    (field) =>
      current.has(field.id) &&
      current.get(field.id) !== getCustomFieldDefaultValue(field, field.parsedOptions),
  )
}

export function applyReusableEmulatorSettings(
  values: SubmittedSettings,
  reusable: z.output<typeof SavedEmulatorSettingSchema>[],
  fields: readonly CustomFieldDefinitionWithOptions[],
) {
  const saved = new Map(reusable.map((entry) => [entry.customFieldDefinitionId, entry.value]))
  const current = new Map(values?.map((entry) => [entry.customFieldDefinitionId, entry.value]))
  return fields.map((field) => ({
    customFieldDefinitionId: field.id,
    value: saved.has(field.id)
      ? saved.get(field.id)
      : current.has(field.id)
        ? current.get(field.id)
        : getCustomFieldDefaultValue(field, field.parsedOptions),
  }))
}
