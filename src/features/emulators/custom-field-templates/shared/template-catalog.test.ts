import { describe, expect, it } from 'vitest'
import { CreateCustomFieldTemplateSchema } from './template.schemas'
import { customFieldTemplates } from '../../../../../prisma/seeders/data/custom-field-templates'

describe('template catalog', () => {
  it.each(customFieldTemplates)('$name follows the editor contract', (template) => {
    const result = CreateCustomFieldTemplateSchema.safeParse(template)
    expect(result.success, result.error?.message).toBe(true)
  })
})
