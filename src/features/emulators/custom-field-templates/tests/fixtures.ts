import { type UserActor } from '@/server/auth/actor'
import { CustomFieldType, Role } from '@orm'
import {
  type TemplateRecord,
  type TemplateFieldRecord,
} from '../server/persistence/template.prisma'

export const TEMPLATE_ID = '00000000-0000-4000-a000-000000000001'
export const EMULATOR_ID = '00000000-0000-4000-a000-000000000002'
export const CATEGORY_ID = '00000000-0000-4000-a000-000000000003'
export const actor: UserActor = {
  type: 'user',
  userId: TEMPLATE_ID,
  role: Role.SUPER_ADMIN,
  permissions: [],
  showNsfw: false,
}
export const rangeField: TemplateFieldRecord = {
  id: TEMPLATE_ID,
  name: 'resolution',
  label: 'Resolution',
  type: CustomFieldType.RANGE,
  options: null,
  defaultValue: 1.5,
  placeholder: null,
  rangeMin: 0.25,
  rangeMax: 4,
  rangeUnit: 'x',
  rangeDecimals: 2,
  isRequired: true,
  categoryName: 'Graphics',
  categoryOrder: 3,
  displayOrder: 0,
}
export const textField: TemplateFieldRecord = {
  ...rangeField,
  id: EMULATOR_ID,
  name: 'driver',
  label: 'Driver',
  type: CustomFieldType.TEXT,
  defaultValue: 'custom',
  placeholder: 'Enter a driver',
  rangeMin: null,
  rangeMax: null,
  rangeUnit: null,
  rangeDecimals: null,
  isRequired: false,
  displayOrder: 1,
}
export function template(fields = [rangeField, textField]): TemplateRecord {
  return {
    id: TEMPLATE_ID,
    name: 'Graphics',
    description: 'Graphics settings',
    createdAt: new Date('2026-01-01'),
    fields,
  }
}
