import { type z } from 'zod'
import { AppError, ResourceError } from '@/lib/errors'
import { createMutationSuccess } from '@/schemas/common'
import { type Actor } from '@/server/auth/actor'
import { parseStoredTemplateField } from './template.mapper'
import { assertCanReadTemplates, assertCanWriteTemplates } from './template.policy'
import { type CustomFieldTemplateRepository } from './template.repository'
import {
  TEMPLATE_NAME_MAX_LENGTH,
  type CreateCustomFieldTemplateSchema,
  type UpdateCustomFieldTemplateSchema,
  type ApplyCustomFieldTemplateSchema,
} from '../shared/template.schemas'

export class CustomFieldTemplateService {
  constructor(private readonly repository: CustomFieldTemplateRepository) {}

  list(actor: Actor) {
    assertCanReadTemplates(actor)
    return this.repository.list()
  }

  async get(actor: Actor, id: string) {
    assertCanReadTemplates(actor)
    const template = await this.repository.get(id)
    if (!template) return ResourceError.customFieldTemplate.notFound()
    return template
  }

  async create(actor: Actor, input: z.output<typeof CreateCustomFieldTemplateSchema>) {
    assertCanWriteTemplates(actor)
    await this.repository.create(input)
    return createMutationSuccess()
  }

  async update(actor: Actor, input: z.output<typeof UpdateCustomFieldTemplateSchema>) {
    assertCanWriteTemplates(actor)
    await this.repository.update(input)
    return createMutationSuccess()
  }

  async delete(actor: Actor, id: string) {
    assertCanWriteTemplates(actor)
    await this.repository.delete(id)
    return createMutationSuccess()
  }

  async duplicate(actor: Actor, id: string) {
    assertCanWriteTemplates(actor)
    return this.repository.transaction(async (repository) => {
      const original = await repository.get(id)
      if (!original) return ResourceError.customFieldTemplate.notFound()
      const prefix = 'Copy of '
      await repository.create({
        name: `${prefix}${original.name.slice(0, TEMPLATE_NAME_MAX_LENGTH - prefix.length).trimEnd()}`,
        description: original.description,
        fields: original.fields.map(parseStoredTemplateField),
      })
      return createMutationSuccess()
    }, 'duplicate')
  }

  async apply(actor: Actor, input: z.output<typeof ApplyCustomFieldTemplateSchema>) {
    assertCanWriteTemplates(actor)
    return this.repository.transaction(async (repository) => {
      const target = await repository.getTarget(input.emulatorId)
      if (!target) return ResourceError.emulator.notFound()
      const templates = await repository.listByIds(input.templateIds)
      if (templates.length !== input.templateIds.length)
        return AppError.notFound('One or more templates')
      const templateOrder = new Map(input.templateIds.map((id, index) => [id, index]))
      templates.sort((a, b) => (templateOrder.get(a.id) ?? 0) - (templateOrder.get(b.id) ?? 0))
      const allFields = templates.flatMap((template) => template.fields)
      if (new Set(allFields.map((field) => field.name)).size !== allFields.length) {
        return AppError.badRequest('Templates contain duplicate field names')
      }
      const existingNames = new Set(target.customFieldDefinitions.map((field) => field.name))
      const fields = allFields
        .filter((field) => !existingNames.has(field.name))
        .map(parseStoredTemplateField)
      if (!fields.length)
        return AppError.badRequest(
          'All fields from the selected templates already exist for this emulator',
        )

      const categories = new Map(
        target.customFieldCategories.map((category) => [category.name, category.id]),
      )
      let categoryOrder =
        target.customFieldCategories.reduce(
          (max, category) => Math.max(max, category.displayOrder),
          -1,
        ) + 1
      let displayOrder =
        target.customFieldDefinitions.reduce(
          (max, field) => Math.max(max, field.displayOrder),
          -1,
        ) + 1
      for (const field of fields) {
        if (field.categoryName && !categories.has(field.categoryName)) {
          const category = await repository.createCategory(
            input.emulatorId,
            field.categoryName,
            categoryOrder++,
          )
          categories.set(field.categoryName, category.id)
        }
        await repository.createField(
          input.emulatorId,
          field,
          field.categoryName ? (categories.get(field.categoryName) ?? null) : null,
          displayOrder++,
        )
      }
      return {
        createdFields: fields.length,
        skippedFields: allFields.length - fields.length,
        templateNames: templates.map((template) => template.name),
      }
    }, 'apply')
  }
}
