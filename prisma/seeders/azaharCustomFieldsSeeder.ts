import { CustomFieldType, Prisma, type PrismaClient } from '@orm/client'
import { syncCustomFieldCategories, type CustomFieldCategorySeed } from './customFieldCategoryUtils'

interface SelectOption {
  value: string
  label: string
}

interface RangeConfig {
  min: number
  max: number
  decimals: number
  unit?: string | null
}

interface AzaharCustomFieldSeed {
  name: string
  label: string
  type: CustomFieldType
  required: boolean
  displayOrder: number
  defaultValue?: string | number | boolean | null
  placeholder?: string | null
  options?: SelectOption[]
  range?: RangeConfig
}

const AZAHAR_EMULATOR_NAME = 'Azahar'

const AZAHAR_CUSTOM_FIELD_CATEGORIES: CustomFieldCategorySeed[] = [
  { name: 'General', displayOrder: 0 },
  { name: 'Graphics', displayOrder: 1 },
  { name: 'CPU', displayOrder: 2 },
  { name: 'Advanced', displayOrder: 3 },
  { name: 'Media', displayOrder: 4 },
]

const AZAHAR_FIELD_CATEGORY_CONFIG: Record<
  string,
  { categoryName: string; categoryOrder: number }
> = {
  emulator_version: { categoryName: 'General', categoryOrder: 0 },
  game_version: { categoryName: 'General', categoryOrder: 1 },
  average_fps: { categoryName: 'General', categoryOrder: 2 },
  dynamic_driver_version: { categoryName: 'Graphics', categoryOrder: 0 },
  graphics_api: { categoryName: 'Graphics', categoryOrder: 1 },
  enable_spiri_v_shader_generation: { categoryName: 'Graphics', categoryOrder: 2 },
  disable_spir_v_optimizer: { categoryName: 'Graphics', categoryOrder: 3 },
  enable_async_shader_complication: { categoryName: 'Graphics', categoryOrder: 4 },
  internal_resolution: { categoryName: 'Graphics', categoryOrder: 5 },
  linear_filtering: { categoryName: 'Graphics', categoryOrder: 6 },
  accurate_multiplication: { categoryName: 'Graphics', categoryOrder: 7 },
  disk_shader_cache: { categoryName: 'Graphics', categoryOrder: 8 },
  texture_filter: { categoryName: 'Graphics', categoryOrder: 9 },
  stereoscopic_3d_mode: { categoryName: 'Graphics', categoryOrder: 10 },
  enable_hardware_shader: { categoryName: 'Graphics', categoryOrder: 11 },
  enable_vsync: { categoryName: 'Graphics', categoryOrder: 12 },
  cpu_jit: { categoryName: 'CPU', categoryOrder: 0 },
  delay_game_render_thread: { categoryName: 'Advanced', categoryOrder: 0 },
  delay_start_with_lle_modules: { categoryName: 'Advanced', categoryOrder: 1 },
  media_url: { categoryName: 'Media', categoryOrder: 0 },
  youtube: { categoryName: 'Media', categoryOrder: 1 },
}

const AZAHAR_CUSTOM_FIELDS: AzaharCustomFieldSeed[] = [
  {
    name: 'emulator_version',
    label: 'Emulator Version',
    type: CustomFieldType.TEXT,
    required: true,
    displayOrder: 0,
    defaultValue: null,
    placeholder: '2123.2',
  },
  {
    name: 'dynamic_driver_version',
    label: 'Graphics Driver',
    type: CustomFieldType.TEXT,
    required: true,
    displayOrder: 1,
    defaultValue: null,
  },
  {
    name: 'graphics_api',
    label: 'Graphics API',
    type: CustomFieldType.SELECT,
    required: false,
    displayOrder: 2,
    defaultValue: 'OpenGLES',
    options: [
      { value: 'OpenGLES', label: 'OpenGLES' },
      { value: 'Software', label: 'Software' },
      { value: 'Vulkan', label: 'Vulkan' },
    ],
  },
  {
    name: 'enable_spiri_v_shader_generation',
    label: 'Enable SPIR-V shader generation',
    type: CustomFieldType.BOOLEAN,
    required: true,
    displayOrder: 3,
    defaultValue: true,
  },
  {
    name: 'disable_spir_v_optimizer',
    label: 'Disable SPIR-V Optimizer',
    type: CustomFieldType.BOOLEAN,
    required: true,
    displayOrder: 4,
    defaultValue: true,
  },
  {
    name: 'enable_async_shader_complication',
    label: 'Enable Async Shader Complication',
    type: CustomFieldType.BOOLEAN,
    required: true,
    displayOrder: 5,
    defaultValue: false,
  },
  {
    name: 'internal_resolution',
    label: 'Internal Resolution',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 6,
    defaultValue: 'native',
    options: [
      { value: 'auto', label: 'Auto (Screen Size)' },
      { value: 'native', label: 'Native (400x240)' },
      { value: '2', label: '2x Native (800x480)' },
      { value: '3', label: '3x Native (1200x720)' },
      { value: '4', label: '4x Native (1600x960)' },
      { value: '5', label: '5x Native (2000x1200)' },
      { value: '6', label: '6x Native (2400x1440)' },
      { value: '7', label: '7x Native (2800x1680)' },
      { value: '8', label: '8x Native (3200x1920)' },
      { value: '9', label: '9x Native (3600x2160)' },
      { value: '10', label: '10x Native (4000x2400)' },
    ],
  },
  {
    name: 'linear_filtering',
    label: 'Linear Filtering',
    type: CustomFieldType.BOOLEAN,
    required: true,
    displayOrder: 7,
    defaultValue: true,
  },
  {
    name: 'accurate_multiplication',
    label: 'Accurate Multiplication',
    type: CustomFieldType.BOOLEAN,
    required: true,
    displayOrder: 8,
    defaultValue: false,
  },
  {
    name: 'disk_shader_cache',
    label: 'Disk Shader Cache',
    type: CustomFieldType.BOOLEAN,
    required: true,
    displayOrder: 9,
    defaultValue: true,
  },
  {
    name: 'texture_filter',
    label: 'Texture Filter',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 10,
    defaultValue: 'None',
    options: [
      { value: 'None', label: 'None' },
      { value: 'Anime4K', label: 'Anime4K' },
      { value: 'Bicubic', label: 'Bicubic' },
      { value: 'ScaleForce', label: 'ScaleForce' },
      { value: 'xBRZ', label: 'xBRZ' },
      { value: 'MMPX', label: 'MMPX' },
    ],
  },
  {
    name: 'delay_game_render_thread',
    label: 'Delay Game Render Thread',
    type: CustomFieldType.RANGE,
    required: false,
    displayOrder: 11,
    defaultValue: null,
    range: {
      min: 0,
      max: 100,
      decimals: 0,
    },
  },
  {
    name: 'stereoscopic_3d_mode',
    label: 'Stereoscopic 3D Mode',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 12,
    defaultValue: 'Off',
    options: [
      { value: 'Off', label: 'Off' },
      { value: 'Side by Side', label: 'Side by Side' },
      { value: 'Reverse Side by Side', label: 'Reverse Side by Side' },
      { value: 'Anaglyph', label: 'Anaglyph' },
      { value: 'Interlaced', label: 'Interlaced' },
      { value: 'Reverse Interlaced', label: 'Reverse Interlaced' },
      { value: 'Cardboard VR', label: 'Cardboard VR' },
    ],
  },
  {
    name: 'cpu_jit',
    label: 'CPU JIT',
    type: CustomFieldType.BOOLEAN,
    required: true,
    displayOrder: 13,
    defaultValue: true,
  },
  {
    name: 'enable_hardware_shader',
    label: 'Enable Hardware Shader',
    type: CustomFieldType.BOOLEAN,
    required: true,
    displayOrder: 14,
    defaultValue: true,
  },
  {
    name: 'enable_vsync',
    label: 'Enable V-Sync',
    type: CustomFieldType.BOOLEAN,
    required: true,
    displayOrder: 15,
    defaultValue: true,
  },
  {
    name: 'delay_start_with_lle_modules',
    label: 'Delay Start With LLE Modules',
    type: CustomFieldType.BOOLEAN,
    required: true,
    displayOrder: 16,
    defaultValue: true,
  },
  {
    name: 'media_url',
    label: 'Screenshots, Blog Post, etc',
    type: CustomFieldType.URL,
    required: false,
    displayOrder: 17,
    defaultValue: null,
  },
  {
    name: 'youtube',
    label: 'YouTube',
    type: CustomFieldType.URL,
    required: false,
    displayOrder: 18,
    defaultValue: null,
  },
  {
    name: 'average_fps',
    label: 'Average FPS',
    type: CustomFieldType.TEXT,
    required: false,
    displayOrder: 19,
    defaultValue: null,
  },
  {
    name: 'game_version',
    label: 'Game Version',
    type: CustomFieldType.TEXT,
    required: false,
    displayOrder: 20,
    defaultValue: null,
  },
]

export default async function azaharCustomFieldsSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding Azahar custom fields...')

  const azahar = await prisma.emulator.findUnique({
    where: { name: AZAHAR_EMULATOR_NAME },
    select: { id: true },
  })

  if (!azahar) {
    console.warn(`⚠️ Emulator "${AZAHAR_EMULATOR_NAME}" not found. Skipping custom field seeding.`)
    return
  }

  const fieldNames = AZAHAR_CUSTOM_FIELDS.map((field) => field.name)
  const categoryIdByName = await syncCustomFieldCategories(
    prisma,
    azahar.id,
    AZAHAR_CUSTOM_FIELD_CATEGORIES,
  )

  for (const field of AZAHAR_CUSTOM_FIELDS) {
    await prisma.customFieldDefinition.upsert({
      where: {
        emulatorId_name: {
          emulatorId: azahar.id,
          name: field.name,
        },
      },
      create: buildDefinitionCreate(azahar.id, field, categoryIdByName),
      update: buildDefinitionUpdate(field, categoryIdByName),
    })
  }

  const removed = await prisma.customFieldDefinition.deleteMany({
    where: {
      emulatorId: azahar.id,
      name: { notIn: fieldNames },
    },
  })

  console.info(
    `✅ Azahar custom fields synced. Updated ${AZAHAR_CUSTOM_FIELDS.length} definitions, removed ${removed.count}.`,
  )
}

function buildDefinitionCreate(
  emulatorId: string,
  field: AzaharCustomFieldSeed,
  categoryIdByName: ReadonlyMap<string, string>,
) {
  const { options, range, defaultValue, placeholder, ...base } = field
  const categoryConfig = AZAHAR_FIELD_CATEGORY_CONFIG[field.name]

  return {
    emulatorId,
    categoryId: resolveCategoryId(field.name, categoryConfig?.categoryName, categoryIdByName),
    name: base.name,
    label: base.label,
    type: base.type,
    options: normalizeJsonInput(options),
    defaultValue: normalizeJsonInput(defaultValue),
    placeholder: placeholder ?? null,
    rangeMin: range?.min ?? null,
    rangeMax: range?.max ?? null,
    rangeDecimals: range?.decimals ?? null,
    rangeUnit: range?.unit ?? null,
    isRequired: base.required,
    displayOrder: base.displayOrder,
    categoryOrder: categoryConfig?.categoryOrder ?? 0,
  }
}

function buildDefinitionUpdate(
  field: AzaharCustomFieldSeed,
  categoryIdByName: ReadonlyMap<string, string>,
) {
  const { options, range, defaultValue, placeholder, ...base } = field
  const categoryConfig = AZAHAR_FIELD_CATEGORY_CONFIG[field.name]

  return {
    categoryId: resolveCategoryId(field.name, categoryConfig?.categoryName, categoryIdByName),
    label: base.label,
    type: base.type,
    options: normalizeJsonInput(options),
    defaultValue: normalizeJsonInput(defaultValue),
    placeholder: placeholder ?? null,
    rangeMin: range?.min ?? null,
    rangeMax: range?.max ?? null,
    rangeDecimals: range?.decimals ?? null,
    rangeUnit: range?.unit ?? null,
    isRequired: base.required,
    displayOrder: base.displayOrder,
    categoryOrder: categoryConfig?.categoryOrder ?? 0,
  }
}

function resolveCategoryId(
  fieldName: string,
  categoryName: string | undefined,
  categoryIdByName: ReadonlyMap<string, string>,
) {
  if (!categoryName) return null

  const categoryId = categoryIdByName.get(categoryName)
  if (!categoryId) {
    throw new Error(`Missing Azahar custom field category "${categoryName}" for ${fieldName}`)
  }

  return categoryId
}

function normalizeJsonInput(
  value: unknown,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) {
    return Prisma.JsonNull
  }

  return value as Prisma.InputJsonValue
}
