import { AppError, ResourceError } from '@/lib/errors'
import { requireActorPermission, type Actor } from '@/server/auth/actor'
import { PERMISSIONS } from '@/utils/permission-system'
import { CustomFieldType } from '@orm'
import { toConfigSnapshot } from './config.mapper'
import { assertCanApplyConfig } from './config.policy'
import { type CustomFieldConfigRepository } from './config.repository'
import { type ApplyCustomFieldConfig, type ConfigField } from '../shared/config.schemas'

function assertCompatibleField(previous: ConfigField, next: ConfigField) {
  if (previous.type !== next.type)
    return AppError.badRequest(
      `Cannot change the type of "${next.name}" because it has report values.`,
    )
  if (
    next.type === CustomFieldType.SELECT &&
    previous.options.some(
      (option) => !next.options.some((candidate) => candidate.value === option.value),
    )
  ) {
    return AppError.badRequest(
      `Cannot remove options from "${next.name}" because it has report values.`,
    )
  }
  if (
    next.type === CustomFieldType.RANGE &&
    ((next.rangeMin ?? 0) > (previous.rangeMin ?? 0) ||
      (next.rangeMax ?? 0) < (previous.rangeMax ?? 0) ||
      (next.rangeDecimals ?? 0) < (previous.rangeDecimals ?? 0))
  ) {
    return AppError.badRequest(
      `Cannot narrow the range of "${next.name}" because it has report values.`,
    )
  }
}

export class CustomFieldConfigService {
  constructor(private readonly repository: CustomFieldConfigRepository) {}

  sources(actor: Actor) {
    requireActorPermission(actor, PERMISSIONS.MANAGE_CUSTOM_FIELDS)
    return this.repository.sources()
  }

  async get(actor: Actor, emulatorId: string) {
    requireActorPermission(actor, PERMISSIONS.MANAGE_CUSTOM_FIELDS)
    const emulator = await this.repository.getEmulator(emulatorId)
    if (!emulator) return ResourceError.emulator.notFound()
    return toConfigSnapshot(emulator)
  }

  apply(actor: Actor, input: ApplyCustomFieldConfig) {
    requireActorPermission(actor, PERMISSIONS.MANAGE_CUSTOM_FIELDS)
    return this.repository.transaction(async (repository) => {
      const emulator = await repository.getEmulator(input.emulatorId)
      if (!emulator) return ResourceError.emulator.notFound()
      assertCanApplyConfig(actor, emulator)
      const snapshot = toConfigSnapshot(emulator)
      if (snapshot.revision !== input.expectedRevision) {
        return AppError.conflict(
          'The configuration has changed. Copy your edits, reload the configuration and try again.',
        )
      }

      const existingFields = new Map(
        emulator.customFieldDefinitions.map((field) => [field.name, field]),
      )
      for (const field of input.configuration.fields) {
        const existing = existingFields.get(field.name)
        if (existing && existing._count.listingValues + existing._count.pcListingValues > 0) {
          const previous = snapshot.configuration.fields.find(
            (candidate) => candidate.name === field.name,
          )
          if (previous) assertCompatibleField(previous, field)
        }
      }

      const categories = new Map(
        emulator.customFieldCategories.map((category) => [category.name, category.id]),
      )
      for (const category of input.configuration.categories) {
        const saved = await repository.saveCategory(input.emulatorId, category)
        categories.set(category.name, saved.id)
      }
      for (const field of input.configuration.fields) {
        const categoryId = field.category === null ? null : categories.get(field.category)
        if (categoryId === undefined)
          return AppError.badRequest(`Unknown category: ${field.category}`)
        await repository.saveField(input.emulatorId, field, categoryId)
      }

      const updated = await repository.getEmulator(input.emulatorId)
      if (!updated) return ResourceError.emulator.notFound()
      return toConfigSnapshot(updated)
    })
  }
}
