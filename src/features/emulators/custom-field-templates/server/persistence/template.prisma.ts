import { Prisma } from '@orm'

export const TEMPLATE_FIELD_SELECT = {
  id: true,
  name: true,
  label: true,
  type: true,
  options: true,
  defaultValue: true,
  placeholder: true,
  rangeMin: true,
  rangeMax: true,
  rangeUnit: true,
  rangeDecimals: true,
  isRequired: true,
  displayOrder: true,
  categoryName: true,
  categoryOrder: true,
} satisfies Prisma.CustomFieldTemplateFieldSelect

export const TEMPLATE_SELECT = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  fields: {
    select: TEMPLATE_FIELD_SELECT,
    orderBy: [{ displayOrder: Prisma.SortOrder.asc }, { name: Prisma.SortOrder.asc }],
  },
} satisfies Prisma.CustomFieldTemplateSelect

export const TEMPLATE_TARGET_SELECT = {
  id: true,
  customFieldCategories: { select: { id: true, name: true, displayOrder: true } },
  customFieldDefinitions: { select: { name: true, displayOrder: true } },
} satisfies Prisma.EmulatorSelect

export type TemplateRecord = Prisma.CustomFieldTemplateGetPayload<{
  select: typeof TEMPLATE_SELECT
}>
export type TemplateFieldRecord = Prisma.CustomFieldTemplateFieldGetPayload<{
  select: typeof TEMPLATE_FIELD_SELECT
}>
