import { CustomFieldType, type Prisma, type PrismaClient } from '@orm/client'
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

interface EdenCustomFieldSeed {
  name: string
  label: string
  type: CustomFieldType
  required: boolean
  displayOrder: number
  categoryName?: string | null
  categoryOrder?: number
  defaultValue?: string | number | boolean | null
  placeholder?: string | null
  options?: SelectOption[]
  range?: RangeConfig
}

const EDEN_EMULATOR_NAME = 'Eden'

const EDEN_CUSTOM_FIELD_CATEGORIES: CustomFieldCategorySeed[] = [
  { name: 'General', displayOrder: 0 },
  { name: 'Graphics', displayOrder: 1 },
  { name: 'Debug', displayOrder: 2 },
  { name: 'CPU', displayOrder: 3 },
  { name: 'Eden Veil', displayOrder: 4 },
]

const EDEN_CUSTOM_FIELDS: EdenCustomFieldSeed[] = [
  {
    name: 'emulator_version',
    label: 'Emulator Version',
    type: CustomFieldType.TEXT,
    required: true,
    defaultValue: null,
    placeholder: '0.0.2-pre-alpha',
    displayOrder: 0,
    categoryName: 'Graphics',
    categoryOrder: 4,
  },
  {
    name: 'dynamic_driver_version',
    label: 'Driver Version',
    type: CustomFieldType.TEXT,
    required: true,
    defaultValue: null,
    placeholder: 'Select first options for non-Android devices',
    displayOrder: 1,
    categoryName: 'Eden Veil',
    categoryOrder: 5,
  },
  {
    name: 'accuracy_level',
    label: 'Accuracy Level',
    type: CustomFieldType.SELECT,
    required: false,
    defaultValue: 'Normal',
    options: [
      { value: 'Normal', label: 'Normal' },
      { value: 'High', label: 'High' },
      { value: 'Extreme (Slow)', label: 'Extreme (Slow)' },
    ],
    displayOrder: 2,
    categoryName: 'CPU',
    categoryOrder: 2,
  },
  {
    name: 'resolution',
    label: 'Resolution',
    type: CustomFieldType.TEXT,
    required: true,
    defaultValue: null,
    displayOrder: 3,
    categoryName: 'General',
    categoryOrder: 0,
  },
  {
    name: 'vsync_mode',
    label: 'VSync Mode',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'FIFO (On)',
    options: [
      { value: 'Immediate (Off)', label: 'Immediate (Off)' },
      { value: 'Mailbox', label: 'Mailbox' },
      { value: 'FIFO (On)', label: 'FIFO (On)' },
      { value: 'FIFO Relaxed', label: 'FIFO Relaxed' },
      { value: 'N/A', label: 'N/A' },
    ],
    displayOrder: 4,
    categoryName: 'Graphics',
    categoryOrder: 5,
  },
  {
    name: 'window_adapting_filter',
    label: 'Window adapting filter',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'Bilinear',
    options: [
      { value: 'Nearest Neighbor', label: 'Nearest Neighbor' },
      { value: 'Bilinear', label: 'Bilinear' },
      { value: 'Bicubic', label: 'Bicubic' },
      { value: 'Gaussian', label: 'Gaussian' },
      { value: 'ScaleForce', label: 'ScaleForce' },
      { value: 'AMD FidelityFX - Super Resolution', label: 'AMD FidelityFX - Super Resolution' },
      { value: 'NVIDIA', label: 'NVIDIA' },
      { value: 'Other', label: 'Other' },
    ],
    displayOrder: 5,
    categoryName: 'Graphics',
    categoryOrder: 3,
  },
  {
    name: 'anti_aliasing_method',
    label: 'Anti-aliasing method',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'None',
    options: [
      { value: 'None', label: 'None' },
      { value: 'FXAA', label: 'FXAA' },
      { value: 'SMAA', label: 'SMAA' },
      { value: 'Other', label: 'Other' },
    ],
    displayOrder: 6,
    categoryName: 'General',
    categoryOrder: 0,
  },
  {
    name: 'anisotropic_filtering',
    label: 'Anisotropic filtering',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'Default',
    options: [
      { value: 'Auto', label: 'Auto' },
      { value: 'Default', label: 'Default' },
      { value: '2x', label: '2x' },
      { value: '4x', label: '4x' },
      { value: '8x', label: '8x' },
      { value: '16x', label: '16x' },
    ],
    displayOrder: 7,
    categoryName: 'Graphics',
    categoryOrder: 8,
  },
  {
    name: 'disk_shader_cache',
    label: 'Disk shader cache',
    type: CustomFieldType.BOOLEAN,
    required: true,
    defaultValue: null,
    displayOrder: 8,
    categoryName: 'Eden Veil',
    categoryOrder: 3,
  },
  {
    name: 'use_async_shaders',
    label: 'Use async shaders',
    type: CustomFieldType.BOOLEAN,
    required: true,
    defaultValue: null,
    displayOrder: 9,
    categoryName: 'Eden Veil',
    categoryOrder: 4,
  },
  {
    name: 'use_reactive_flushing',
    label: 'Use reactive flushing',
    type: CustomFieldType.BOOLEAN,
    required: true,
    defaultValue: null,
    displayOrder: 10,
    categoryName: 'Graphics',
    categoryOrder: 6,
  },
  {
    name: 'docked_mode',
    label: 'Docked Mode',
    type: CustomFieldType.BOOLEAN,
    required: true,
    defaultValue: null,
    displayOrder: 11,
    categoryName: 'Eden Veil',
    categoryOrder: 6,
  },
  {
    name: 'audio_output_engine',
    label: 'Audio output engine',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'Auto',
    options: [
      { value: 'Auto', label: 'Auto' },
      { value: 'oboe', label: 'oboe' },
      { value: 'cubeb', label: 'cubeb' },
      { value: 'Null', label: 'Null' },
    ],
    displayOrder: 12,
    categoryName: 'Graphics',
    categoryOrder: 7,
  },
  {
    name: 'gpu_api',
    label: 'GPU API',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'Vulkan',
    options: [
      { value: 'Vulkan', label: 'Vulkan' },
      { value: 'OpenGL', label: 'OpenGL' },
      { value: 'Other', label: 'Other' },
    ],
    displayOrder: 13,
    categoryName: 'General',
    categoryOrder: 1,
  },
  {
    name: 'cpu_accuracy',
    label: 'CPU accuracy',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'Auto',
    options: [
      { value: 'Auto', label: 'Auto' },
      { value: 'Accurate', label: 'Accurate' },
      { value: 'Unsafe', label: 'Unsafe' },
      { value: 'Paranoid (Slow)', label: 'Paranoid (Slow)' },
    ],
    displayOrder: 14,
    categoryName: 'General',
    categoryOrder: 2,
  },
  {
    name: 'cpu_backend',
    label: 'CPU backend',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'Native code execution (NCE)',
    options: [
      { value: 'Dynamic (Slow)', label: 'Dynamic (Slow)' },
      { value: 'Native code execution (NCE)', label: 'Native code execution (NCE)' },
    ],
    displayOrder: 15,
    categoryName: 'CPU',
    categoryOrder: 0,
  },
  {
    name: 'extended_dynamic_state',
    label: 'Extended Dynamic State',
    type: CustomFieldType.RANGE,
    required: true,
    defaultValue: 0,
    range: { min: 0, max: 3, unit: '', decimals: 0 },
    displayOrder: 16,
    categoryName: 'CPU',
    categoryOrder: 1,
  },
  {
    name: 'provoking_vertex',
    label: 'Provoking Vertex',
    type: CustomFieldType.BOOLEAN,
    required: true,
    defaultValue: false,
    displayOrder: 17,
    categoryName: 'Eden Veil',
    categoryOrder: 7,
  },
  {
    name: 'descriptor_indexing',
    label: 'Descriptor Indexing',
    type: CustomFieldType.BOOLEAN,
    required: true,
    defaultValue: false,
    displayOrder: 18,
    categoryName: 'Eden Veil',
    categoryOrder: 8,
  },
  {
    name: 'enhanced_frame_pacing',
    label: 'Enhanced Frame Pacing',
    type: CustomFieldType.BOOLEAN,
    required: true,
    defaultValue: true,
    displayOrder: 19,
    categoryName: 'Eden Veil',
    categoryOrder: 9,
  },
  {
    name: 'use_fast_gpu_time',
    label: 'Use Fast GPU Time',
    type: CustomFieldType.BOOLEAN,
    required: true,
    defaultValue: false,
    displayOrder: 20,
    categoryName: 'General',
    categoryOrder: 2,
  },
  {
    name: 'nvdec_emulation',
    label: 'NVDEC Emulation',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'CPU',
    options: [
      { value: 'None', label: 'None' },
      { value: 'CPU', label: 'CPU' },
      { value: 'GPU', label: 'GPU' },
    ],
    displayOrder: 21,
    categoryName: 'Debug',
    categoryOrder: 0,
  },
  {
    name: 'astc_recompression_method',
    label: 'ASTC Recompression Method',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'Uncompressed',
    options: [
      { value: 'Uncompressed', label: 'Uncompressed' },
      { value: 'BC1 (Low Quality)', label: 'BC1 (Low Quality)' },
      { value: 'BC3 (Medium Quality)', label: 'BC3 (Medium Quality)' },
    ],
    displayOrder: 22,
    categoryName: 'CPU',
    categoryOrder: 3,
  },
  {
    name: 'vram_usage_mode',
    label: 'VRAM Usage Mode',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'Conservative',
    options: [
      { value: 'Conservative', label: 'Conservative' },
      { value: 'Aggressive', label: 'Aggressive' },
    ],
    displayOrder: 23,
    categoryName: 'General',
    categoryOrder: 3,
  },
  {
    name: 'optimize_spirv_output',
    label: 'Optimize SPIRV output',
    type: CustomFieldType.SELECT,
    required: true,
    defaultValue: 'On Load',
    options: [
      { value: 'Never', label: 'Never' },
      { value: 'On Load', label: 'On Load' },
      { value: 'Always', label: 'Always' },
    ],
    displayOrder: 24,
    categoryName: 'Eden Veil',
    categoryOrder: 10,
  },
  {
    name: 'fast_cpu_time',
    label: 'Fast CPU Time',
    type: CustomFieldType.BOOLEAN,
    required: true,
    defaultValue: false,
    displayOrder: 25,
    categoryName: 'CPU',
    categoryOrder: 4,
  },
  {
    name: 'enable_lru_cache',
    label: 'Enable LRU Cache',
    type: CustomFieldType.BOOLEAN,
    required: true,
    defaultValue: false,
    displayOrder: 26,
    categoryName: 'Debug',
    categoryOrder: 1,
  },
  {
    name: 'synchronize_core_speed',
    label: 'Syncronize Core Speed',
    type: CustomFieldType.BOOLEAN,
    required: true,
    defaultValue: false,
    displayOrder: 27,
  },
  {
    name: 'media_url',
    label: 'Screenshots, Blog Post, etc',
    type: CustomFieldType.URL,
    required: false,
    defaultValue: null,
    displayOrder: 28,
  },
  {
    name: 'youtube',
    label: 'YouTube',
    type: CustomFieldType.URL,
    required: false,
    defaultValue: null,
    displayOrder: 29,
  },
  {
    name: 'game_version',
    label: 'Game Version',
    type: CustomFieldType.TEXT,
    required: false,
    defaultValue: null,
    displayOrder: 30,
  },
  {
    name: 'average_fps',
    label: 'Average FPS',
    type: CustomFieldType.TEXT,
    required: false,
    defaultValue: null,
    displayOrder: 31,
  },
]

export default async function edenCustomFieldsSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding Eden custom fields...')

  const eden = await prisma.emulator.findUnique({
    where: { name: EDEN_EMULATOR_NAME },
    select: { id: true },
  })

  if (!eden) {
    console.warn(`⚠️ Emulator "${EDEN_EMULATOR_NAME}" not found. Skipping custom field seeding.`)
    return
  }

  const fieldNames = EDEN_CUSTOM_FIELDS.map((field) => field.name)
  const categoryIdByName = await syncCustomFieldCategories(
    prisma,
    eden.id,
    EDEN_CUSTOM_FIELD_CATEGORIES,
  )

  for (const field of EDEN_CUSTOM_FIELDS) {
    await prisma.customFieldDefinition.upsert({
      where: {
        emulatorId_name: {
          emulatorId: eden.id,
          name: field.name,
        },
      },
      create: buildDefinitionCreate(eden.id, field, categoryIdByName),
      update: buildDefinitionUpdate(field, categoryIdByName),
    })
  }

  const removed = await prisma.customFieldDefinition.deleteMany({
    where: {
      emulatorId: eden.id,
      name: { notIn: fieldNames },
    },
  })

  console.info(
    `✅ Eden custom fields synced. Updated ${EDEN_CUSTOM_FIELDS.length} definitions, removed ${removed.count}.`,
  )
}

function buildDefinitionCreate(
  emulatorId: string,
  field: EdenCustomFieldSeed,
  categoryIdByName: ReadonlyMap<string, string>,
) {
  const { options, range, defaultValue, placeholder, categoryOrder, ...base } = field

  return {
    emulatorId,
    categoryId: resolveCategoryId(field, categoryIdByName),
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
    categoryOrder: categoryOrder ?? 0,
  }
}

function buildDefinitionUpdate(
  field: EdenCustomFieldSeed,
  categoryIdByName: ReadonlyMap<string, string>,
) {
  const { options, range, defaultValue, placeholder, categoryOrder, ...base } = field

  return {
    categoryId: resolveCategoryId(field, categoryIdByName),
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
    categoryOrder: categoryOrder ?? 0,
  }
}

function resolveCategoryId(
  field: EdenCustomFieldSeed,
  categoryIdByName: ReadonlyMap<string, string>,
) {
  if (!field.categoryName) return null

  const categoryId = categoryIdByName.get(field.categoryName)
  if (!categoryId) {
    throw new Error(`Missing Eden custom field category "${field.categoryName}" for ${field.name}`)
  }

  return categoryId
}

function normalizeJsonInput(
  value: unknown,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  return value as Prisma.InputJsonValue
}
