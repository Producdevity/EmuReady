import { type z } from 'zod'
import { AppError } from '@/lib/errors'
import { CustomFieldType, Prisma } from '@orm'
import { supportsPlaceholder } from '../../shared/custom-field-attributes.schemas'
import { TemplateFieldSchema } from '../shared/template.schemas'
import { type TemplateFieldRecord } from './persistence/template.prisma'

export function parseStoredTemplateField(field: TemplateFieldRecord) {
  const { id, ...input } = field
  const result = TemplateFieldSchema.safeParse({
    ...input,
    options: input.options ?? [],
    placeholder: supportsPlaceholder(input.type) ? input.placeholder : null,
  })
  if (!result.success) {
    return AppError.badRequest(
      `Template field "${field.name}" has invalid settings. Edit the template before applying or duplicating it.`,
    )
  }
  return result.data
}

export function toFieldAttributes(field: z.output<typeof TemplateFieldSchema>) {
  return {
    name: field.name,
    label: field.label,
    type: field.type,
    options: field.type === CustomFieldType.SELECT ? field.options : Prisma.DbNull,
    defaultValue: field.defaultValue ?? Prisma.DbNull,
    placeholder: field.placeholder,
    rangeMin: field.rangeMin,
    rangeMax: field.rangeMax,
    rangeUnit: field.rangeUnit,
    rangeDecimals: field.rangeDecimals,
    isRequired: field.isRequired,
  }
}

export function toTemplateFieldData(field: z.output<typeof TemplateFieldSchema>) {
  return {
    ...toFieldAttributes(field),
    categoryName: field.categoryName,
    categoryOrder: field.categoryOrder,
    displayOrder: field.displayOrder,
  } satisfies Prisma.CustomFieldTemplateFieldCreateWithoutTemplateInput
}
