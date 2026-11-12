import { AppError, ResourceError } from '@/lib/errors'
import { requireActorPermission, type Actor } from '@/server/auth/actor'
import { PERMISSIONS } from '@/utils/permission-system'
import { CustomFieldType } from '@orm'
import { toConfigField, toConfigSnapshot } from './config.mapper'
import { assertCanManageConfig } from './config.policy'
import { type CustomFieldConfigRepository } from './config.repository'
import { type SaveCustomFieldConfig, type ConfigField } from '../shared/config.schemas'

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
    (previous.rangeUnit ?? '') !== (next.rangeUnit ?? '')
  ) {
    return AppError.badRequest(
      `Cannot change the unit of "${next.name}" because it has report values.`,
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

function matchConfigItems<
  Existing extends { id: string; name: string },
  Incoming extends { id?: string; name: string },
>(existing: Existing[], incoming: Incoming[]) {
  const byId = new Map(existing.map((item) => [item.id, item]))
  const byName = new Map(existing.map((item) => [item.name, item]))
  const matched = new Set<string>()
  const items = incoming.map((value) => {
    const previous = (value.id ? byId.get(value.id) : undefined) ?? byName.get(value.name)
    if (previous) {
      if (matched.has(previous.id))
        return AppError.badRequest(`Multiple JSON items match "${previous.name}".`)
      matched.add(previous.id)
    }
    return { value, previous }
  })
  return { items, removed: existing.filter((item) => !matched.has(item.id)) }
}

export class CustomFieldConfigService {
  constructor(private readonly repository: CustomFieldConfigRepository) {}

  async get(actor: Actor, emulatorId: string) {
    requireActorPermission(actor, PERMISSIONS.MANAGE_CUSTOM_FIELDS)
    const emulator = await this.repository.getEmulator(emulatorId)
    if (!emulator) return ResourceError.emulator.notFound()
    assertCanManageConfig(actor, emulator)
    return toConfigSnapshot(emulator)
  }

  save(actor: Actor, input: SaveCustomFieldConfig) {
    requireActorPermission(actor, PERMISSIONS.MANAGE_CUSTOM_FIELDS)
    return this.repository.transaction(async (repository) => {
      const emulator = await repository.getEmulator(input.emulatorId)
      if (!emulator) return ResourceError.emulator.notFound()
      assertCanManageConfig(actor, emulator)
      const snapshot = toConfigSnapshot(emulator)
      if (snapshot.revision !== input.expectedRevision) {
        return AppError.conflict(
          'The configuration has changed. Copy your edits, reload the configuration and try again.',
        )
      }

      const fields = matchConfigItems(emulator.customFieldDefinitions, input.configuration.fields)
      const categories = matchConfigItems(
        emulator.customFieldCategories,
        input.configuration.categories,
      )
      for (const field of fields.removed) {
        if (field._count.listingValues + field._count.pcListingValues > 0) {
          return AppError.badRequest(`Cannot remove "${field.name}" because it has report values.`)
        }
      }
      for (const field of fields.items) {
        if (
          field.previous &&
          field.previous._count.listingValues + field.previous._count.pcListingValues > 0
        ) {
          assertCompatibleField(toConfigField(field.previous), field.value)
        }
      }

      await repository.removeFields(
        input.emulatorId,
        fields.removed.map((field) => field.id),
      )
      await repository.removeCategories(
        input.emulatorId,
        categories.removed.map((category) => category.id),
      )
      await repository.stageRenames(
        input.emulatorId,
        categories.items.flatMap((item) =>
          item.previous && item.previous.name !== item.value.name ? [item.previous.id] : [],
        ),
        fields.items.flatMap((item) =>
          item.previous && item.previous.name !== item.value.name ? [item.previous.id] : [],
        ),
      )
      const categoryIds = new Map<string, string>()
      for (const category of categories.items) {
        const saved = await repository.saveCategory(
          input.emulatorId,
          category.value,
          category.previous?.id,
        )
        categoryIds.set(category.value.name, saved.id)
      }
      for (const field of fields.items) {
        const categoryId =
          field.value.category === null ? null : categoryIds.get(field.value.category)
        if (categoryId === undefined)
          return AppError.badRequest(`Unknown category: ${field.value.category}`)
        await repository.saveField(input.emulatorId, field.value, categoryId, field.previous?.id)
      }

      const updated = await repository.getEmulator(input.emulatorId)
      if (!updated) return ResourceError.emulator.notFound()
      return toConfigSnapshot(updated)
    })
  }
}
