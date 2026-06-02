import { CustomFieldType, type Prisma, type PrismaClient } from '@orm/client'

type CustomFieldDefinitionForSeed = {
  id: string
  name: string
  type: CustomFieldType
  options: Prisma.JsonValue | null
  defaultValue: Prisma.JsonValue | null
  rangeMin: number | null
  rangeMax: number | null
}

export type CustomFieldDefinitionCache = Map<string, CustomFieldDefinitionForSeed[]>

const CUSTOM_FIELD_VALUE_OVERRIDES: Record<string, Prisma.InputJsonValue[]> = {
  emulator_version: ['2123.2', '0.0.2-pre-alpha', '1.0.0'],
  dynamic_driver_version: ['Turnip v24.3.0 R10', 'Mesa Turnip Adreno 24.2', 'System default'],
  graphics_driver: ['Turnip (Adreno)', 'Vortek (Universal)', 'VirGL (Universal)'],
  graphics_api: ['Vulkan', 'OpenGLES'],
  gpu_api: ['Vulkan', 'OpenGL'],
  resolution: ['1280x720 (16:9)', '2x', 'Native'],
  internal_resolution: ['native', '2', '3'],
  average_fps: ['58', '45', '30'],
  game_version: ['1.0.0', '1.1.0', 'Latest'],
  youtube: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
  media_url: ['https://example.com/emuready-seed-screenshot'],
  dx_wrapper_config: ['DXVK async enabled, 60 FPS cap, 4096 MB max memory'],
  env_variables: ['MESA_GL_VERSION_OVERRIDE=4.6\nBOX64_DYNAREC_SAFEFLAGS=1'],
  exec_arguments: ['-skipinitialbootstrap -nocrashmonitor'],
}

export function createCustomFieldDefinitionCache(): CustomFieldDefinitionCache {
  return new Map<string, CustomFieldDefinitionForSeed[]>()
}

export async function seedListingCustomFieldValues(
  prisma: PrismaClient,
  definitionCache: CustomFieldDefinitionCache,
  listingId: string,
  emulatorId: string,
  seedIndex: number,
): Promise<number> {
  const definitions = await getCustomFieldDefinitions(prisma, definitionCache, emulatorId)
  let createdOrUpdated = 0

  for (const definition of definitions) {
    const value = getSeedValueForCustomField(definition, seedIndex)
    if (value === undefined) continue

    await prisma.listingCustomFieldValue.upsert({
      where: {
        listingId_customFieldDefinitionId: {
          listingId,
          customFieldDefinitionId: definition.id,
        },
      },
      create: {
        listingId,
        customFieldDefinitionId: definition.id,
        value,
      },
      update: { value },
    })
    createdOrUpdated += 1
  }

  return createdOrUpdated
}

export async function seedPcListingCustomFieldValues(
  prisma: PrismaClient,
  definitionCache: CustomFieldDefinitionCache,
  pcListingId: string,
  emulatorId: string,
  seedIndex: number,
): Promise<number> {
  const definitions = await getCustomFieldDefinitions(prisma, definitionCache, emulatorId)
  let createdOrUpdated = 0

  for (const definition of definitions) {
    const value = getSeedValueForCustomField(definition, seedIndex)
    if (value === undefined) continue

    await prisma.pcListingCustomFieldValue.upsert({
      where: {
        pcListingId_customFieldDefinitionId: {
          pcListingId,
          customFieldDefinitionId: definition.id,
        },
      },
      create: {
        pcListingId,
        customFieldDefinitionId: definition.id,
        value,
      },
      update: { value },
    })
    createdOrUpdated += 1
  }

  return createdOrUpdated
}

async function getCustomFieldDefinitions(
  prisma: PrismaClient,
  definitionCache: CustomFieldDefinitionCache,
  emulatorId: string,
) {
  const cachedDefinitions = definitionCache.get(emulatorId)
  if (cachedDefinitions) return cachedDefinitions

  const definitions = await prisma.customFieldDefinition.findMany({
    where: { emulatorId },
    select: {
      id: true,
      name: true,
      type: true,
      options: true,
      defaultValue: true,
      rangeMin: true,
      rangeMax: true,
    },
    orderBy: [{ categoryOrder: 'asc' }, { displayOrder: 'asc' }],
  })

  definitionCache.set(emulatorId, definitions)
  return definitions
}

function getSeedValueForCustomField(
  definition: CustomFieldDefinitionForSeed,
  seedIndex: number,
): Prisma.InputJsonValue | undefined {
  const override = getOverrideValue(definition, seedIndex)
  if (override !== undefined) return override

  if (isJsonPrimitive(definition.defaultValue)) {
    return definition.defaultValue
  }

  switch (definition.type) {
    case CustomFieldType.BOOLEAN:
      return seedIndex % 2 === 0
    case CustomFieldType.RANGE:
      return getRangeValue(definition)
    case CustomFieldType.SELECT:
      return getFirstSelectOptionValue(definition.options)
    case CustomFieldType.URL:
      return `https://example.com/${definition.name}`
    case CustomFieldType.TEXTAREA:
      return `Seeded ${definition.name.replaceAll('_', ' ')} configuration.`
    case CustomFieldType.TEXT:
      return `Seeded ${definition.name.replaceAll('_', ' ')}`
  }
}

function getOverrideValue(
  definition: CustomFieldDefinitionForSeed,
  seedIndex: number,
): Prisma.InputJsonValue | undefined {
  const values = CUSTOM_FIELD_VALUE_OVERRIDES[definition.name]
  if (!values || values.length === 0) return undefined

  const value = values[seedIndex % values.length]
  if (definition.type !== CustomFieldType.SELECT) return value

  const optionValues = getSelectOptionValues(definition.options)
  if (optionValues.length === 0) return value
  return typeof value === 'string' && optionValues.includes(value) ? value : optionValues[0]
}

function getRangeValue(definition: CustomFieldDefinitionForSeed): number {
  if (typeof definition.defaultValue === 'number') return definition.defaultValue

  const min = definition.rangeMin ?? 0
  const max = definition.rangeMax ?? min
  return Math.round((min + max) / 2)
}

function getFirstSelectOptionValue(options: Prisma.JsonValue | null): string | undefined {
  return getSelectOptionValues(options)[0]
}

function getSelectOptionValues(options: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(options)) return []

  return options.flatMap((option) => {
    if (!isJsonObject(option)) return []
    return typeof option.value === 'string' ? [option.value] : []
  })
}

function isJsonPrimitive(value: Prisma.JsonValue | null): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function isJsonObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
