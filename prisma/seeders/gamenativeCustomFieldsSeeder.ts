import { CustomFieldType, Prisma, type PrismaClient } from '@orm/client'
import { syncCustomFieldCategories, type CustomFieldCategorySeed } from './customFieldCategoryUtils'

interface SelectOption {
  value: string
  label: string
}

interface GameNativeCustomFieldSeed {
  name: string
  label: string
  type: CustomFieldType
  required: boolean
  displayOrder: number
  defaultValue?: string | number | boolean | null
  placeholder?: string | null
  options?: SelectOption[]
}

const GAMENATIVE_EMULATOR_NAME = 'GameNative'

const GAMENATIVE_CUSTOM_FIELD_CATEGORIES: CustomFieldCategorySeed[] = [
  { name: 'General', displayOrder: 0 },
  { name: 'Graphics', displayOrder: 1 },
  { name: 'Runtime', displayOrder: 2 },
  { name: 'Input', displayOrder: 3 },
  { name: 'Media', displayOrder: 4 },
]

const GAMENATIVE_FIELD_CATEGORY_CONFIG: Record<
  string,
  { categoryName: string; categoryOrder: number }
> = {
  emulator_version: { categoryName: 'General', categoryOrder: 0 },
  game_version: { categoryName: 'General', categoryOrder: 1 },
  average_fps: { categoryName: 'General', categoryOrder: 2 },
  resolution: { categoryName: 'General', categoryOrder: 3 },
  audio_driver: { categoryName: 'General', categoryOrder: 4 },
  graphics_driver: { categoryName: 'Graphics', categoryOrder: 0 },
  dynamic_driver_version: { categoryName: 'Graphics', categoryOrder: 1 },
  dx_wrapper: { categoryName: 'Graphics', categoryOrder: 2 },
  dxvk_version: { categoryName: 'Graphics', categoryOrder: 3 },
  dx_wrapper_config: { categoryName: 'Graphics', categoryOrder: 4 },
  max_device_memory: { categoryName: 'Graphics', categoryOrder: 5 },
  use_adrenotools_turnip: { categoryName: 'Graphics', categoryOrder: 6 },
  env_variables: { categoryName: 'Runtime', categoryOrder: 0 },
  box64_version: { categoryName: 'Runtime', categoryOrder: 1 },
  box64_preset: { categoryName: 'Runtime', categoryOrder: 2 },
  startup_selection: { categoryName: 'Runtime', categoryOrder: 3 },
  container_variant: { categoryName: 'Runtime', categoryOrder: 4 },
  wine_version: { categoryName: 'Runtime', categoryOrder: 5 },
  steam_type: { categoryName: 'Runtime', categoryOrder: 6 },
  fex_core_version: { categoryName: 'Runtime', categoryOrder: 7 },
  '32_bit_emulator': { categoryName: 'Runtime', categoryOrder: 8 },
  '64_bit_emulator': { categoryName: 'Runtime', categoryOrder: 9 },
  fex_core_preset: { categoryName: 'Runtime', categoryOrder: 10 },
  exec_arguments: { categoryName: 'Runtime', categoryOrder: 11 },
  use_steam_input: { categoryName: 'Input', categoryOrder: 0 },
  enable_x_input_api: { categoryName: 'Input', categoryOrder: 1 },
  enable_direct_input_api: { categoryName: 'Input', categoryOrder: 2 },
  direct_input_mapper_type: { categoryName: 'Input', categoryOrder: 3 },
  youtube: { categoryName: 'Media', categoryOrder: 0 },
  media_url: { categoryName: 'Media', categoryOrder: 1 },
}

const GAMENATIVE_CUSTOM_FIELDS: GameNativeCustomFieldSeed[] = [
  {
    name: 'emulator_version',
    label: 'Emulator Version',
    type: CustomFieldType.TEXT,
    required: true,
    displayOrder: 0,
    defaultValue: null,
  },
  {
    name: 'graphics_driver',
    label: 'Graphics Driver',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 1,
    defaultValue: 'Vortek (Universal)',
    options: [
      { value: 'Vortek (Universal)', label: 'Vortek (Universal)' },
      { value: 'Turnip (Adreno)', label: 'Turnip (Adreno)' },
      { value: 'VirGL (Universal)', label: 'VirGL (Universal)' },
      { value: 'Adreno (Adreno)', label: 'Adreno (Adreno)' },
      { value: 'SD 8 Elite (SD 8 Elite)', label: 'SD 8 Elite (SD 8 Elite)' },
      { value: 'Wrapper', label: 'Wrapper (Bionic)' },
      { value: 'Wrapper-v2', label: 'Wrapper-v2 (Bionic)' },
      { value: 'Wrapper-leegao', label: 'Wrapper-leegao (Bionic)' },
      { value: 'Wrapper-legacy', label: 'Wrapper-legacy (Bionic)' },
    ],
  },
  {
    name: 'dx_wrapper',
    label: 'DX Wrapper',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 2,
    defaultValue: 'DXVK',
    options: [
      { value: 'WineD3D', label: 'WineD3D' },
      { value: 'DXVK', label: 'DXVK' },
      { value: 'VKD3D', label: 'VKD3D' },
      { value: 'CNC DDraw', label: 'CNC DDraw' },
      { value: 'Other', label: 'Other' },
    ],
  },
  {
    name: 'dxvk_version',
    label: 'DXVK Version',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 3,
    defaultValue: '2.6.1-gplasync',
    options: [
      { value: '1.10.1', label: '1.10.1' },
      { value: '1.10.3', label: '1.10.3' },
      { value: 'async-1.10.3', label: 'async-1.10.3' },
      { value: '1.10.9-sarek', label: '1.10.9-sarek' },
      { value: '1.11.1-sarek', label: '1.11.1-sarek' },
      { value: '1.9.2', label: '1.9.2' },
      { value: '2.3.1', label: '2.3.1' },
      { value: '2.4-gplasync', label: '2.4-gplasync' },
      { value: '2.4.1', label: '2.4.1' },
      { value: '2.4.1-gplasync', label: '2.4.1-gplasync' },
      { value: '2.6.1-gplasync', label: '2.6.1-gplasync' },
      { value: '2.6-arm64ec', label: '2.6-arm64ec' },
      { value: '2.7.1', label: '2.7.1' },
      { value: 'other', label: 'Other (specify in notes)' },
    ],
  },
  {
    name: 'dx_wrapper_config',
    label: 'DX Wrapper Config (Version, Frame Rate, Max Memory)',
    type: CustomFieldType.TEXTAREA,
    required: false,
    displayOrder: 4,
    defaultValue: null,
  },
  {
    name: 'audio_driver',
    label: 'Audio Driver',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 5,
    defaultValue: 'alsa',
    options: [
      { value: 'alsa', label: 'ALSA' },
      { value: 'pulse', label: 'PulseAudio' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    name: 'env_variables',
    label: 'Environment Variables',
    type: CustomFieldType.TEXTAREA,
    required: false,
    displayOrder: 6,
    defaultValue: null,
  },
  {
    name: 'box64_version',
    label: 'Box64 Version',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 7,
    defaultValue: '0.3.6',
    options: [
      { value: '0.3.2', label: '0.3.2' },
      { value: '0.3.4', label: '0.3.4' },
      { value: '0.3.6', label: '0.3.6' },
      { value: '0.3.7', label: '0.3.7' },
      { value: '0.3.8', label: '0.3.8' },
      { value: '0.4.0', label: '0.4.0' },
    ],
  },
  {
    name: 'box64_preset',
    label: 'Box64 Preset',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 8,
    defaultValue: 'compatibility',
    options: [
      { value: 'stability', label: 'Stability' },
      { value: 'compatibility', label: 'Compatibility' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'performance', label: 'Performance' },
      { value: 'unity', label: 'Unity' },
      { value: 'unity_mono_bleeding_edge', label: 'Unity Mono Bleeding Edge' },
      { value: 'denuvo', label: 'Denuvo' },
      { value: 'other', label: 'Other/Custom' },
    ],
  },
  {
    name: 'startup_selection',
    label: 'Startup Selection',
    type: CustomFieldType.SELECT,
    required: false,
    displayOrder: 9,
    defaultValue: 'Aggressive (Stop services on startup)',
    options: [
      { value: 'Normal (Load all services)', label: 'Normal (Load all services)' },
      {
        value: 'Essential (Load only essential services)',
        label: 'Essential (Load only essential services)',
      },
      {
        value: 'Aggressive (Stop services on startup)',
        label: 'Aggressive (Stop services on startup)',
      },
      { value: 'Other', label: 'Other' },
    ],
  },
  {
    name: 'resolution',
    label: 'Resolution (Screen Size)',
    type: CustomFieldType.TEXT,
    required: true,
    displayOrder: 10,
    defaultValue: '1280x720 (16:9)',
  },
  {
    name: 'youtube',
    label: 'YouTube',
    type: CustomFieldType.URL,
    required: false,
    displayOrder: 11,
    defaultValue: null,
  },
  {
    name: 'media_url',
    label: 'Screenshots, Blog Post, etc',
    type: CustomFieldType.URL,
    required: false,
    displayOrder: 12,
    defaultValue: null,
  },
  {
    name: 'exec_arguments',
    label: 'Exec Arguments',
    type: CustomFieldType.TEXT,
    required: false,
    displayOrder: 13,
    defaultValue: null,
    placeholder:
      '-noverifyfiles -nobootstrapupdate -skipinitialbootstrap -norepairfiles -nocrashmonitor -noshaders',
  },
  {
    name: 'game_version',
    label: 'Game Version',
    type: CustomFieldType.TEXT,
    required: false,
    displayOrder: 14,
    defaultValue: null,
  },
  {
    name: 'average_fps',
    label: 'Average FPS',
    type: CustomFieldType.TEXT,
    required: false,
    displayOrder: 15,
    defaultValue: null,
  },
  {
    name: 'container_variant',
    label: 'Container Variant',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 16,
    defaultValue: 'bionic',
    options: [
      { value: 'bionic', label: 'bionic' },
      { value: 'glibc', label: 'glibc' },
    ],
  },
  {
    name: 'wine_version',
    label: 'Wine Version',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 17,
    defaultValue: 'proton-9.0-arm64ec',
    options: [
      { value: 'wine-9.2-x86_64', label: 'wine-9.2-x86_64 (Glibc)' },
      { value: 'proton-9.0-arm64ec', label: 'proton-9.0-arm64ec (Bionic)' },
      { value: 'proton-9.0-x86_64', label: 'proton-9.0-x86_64 (Bionic)' },
      { value: 'proton-10.0-arm64ec', label: 'proton-10.0-arm64ec (Bionic)' },
    ],
  },
  {
    name: 'steam_type',
    label: 'Steam Type',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 18,
    defaultValue: 'normal',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'light', label: 'Light' },
      { value: 'ultra_light', label: 'Ultra Light' },
    ],
  },
  {
    name: 'dynamic_driver_version',
    label: 'Dynamic Driver Version',
    type: CustomFieldType.TEXT,
    required: true,
    displayOrder: 19,
    defaultValue: null,
  },
  {
    name: 'max_device_memory',
    label: 'Max Device Memory',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 20,
    defaultValue: '0',
    options: [
      { value: '0', label: '0 MB' },
      { value: '512', label: '512 MB' },
      { value: '1024', label: '1024 MB' },
      { value: '2048', label: '2048 MB' },
      { value: '4096', label: '4096 MB' },
    ],
  },
  {
    name: 'use_adrenotools_turnip',
    label: 'Use Adrenotools Turnip',
    type: CustomFieldType.BOOLEAN,
    required: true,
    displayOrder: 21,
    defaultValue: true,
  },
  {
    name: 'fex_core_version',
    label: 'FEXCore Version',
    type: CustomFieldType.TEXT,
    required: true,
    displayOrder: 22,
    defaultValue: '2603',
  },
  {
    name: '32_bit_emulator',
    label: '32-bit Emulator',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 23,
    defaultValue: 'fex',
    options: [
      { value: 'fex', label: 'FEXCore' },
      { value: 'box', label: 'Box32' },
    ],
  },
  {
    name: '64_bit_emulator',
    label: '64-bit Emulator',
    type: CustomFieldType.SELECT,
    required: false,
    displayOrder: 24,
    defaultValue: 'fex',
    options: [
      { value: 'fex', label: 'FEXCore' },
      { value: 'box', label: 'Box64' },
    ],
  },
  {
    name: 'fex_core_preset',
    label: 'FEXCore Preset',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 25,
    defaultValue: 'intermediate',
    options: [
      { value: 'stability', label: 'Stability' },
      { value: 'compatibility', label: 'Compatibility' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'performance', label: 'Performance' },
      { value: 'extreme', label: 'Extreme' },
      { value: 'denuvo', label: 'Denuvo' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    name: 'use_steam_input',
    label: 'Use Steam Input',
    type: CustomFieldType.BOOLEAN,
    required: false,
    displayOrder: 26,
    defaultValue: false,
  },
  {
    name: 'enable_x_input_api',
    label: 'Enable XInput API',
    type: CustomFieldType.BOOLEAN,
    required: false,
    displayOrder: 27,
    defaultValue: true,
  },
  {
    name: 'enable_direct_input_api',
    label: 'Enable DirectInput API',
    type: CustomFieldType.BOOLEAN,
    required: false,
    displayOrder: 28,
    defaultValue: true,
  },
  {
    name: 'direct_input_mapper_type',
    label: 'DirectInput Mapper Type',
    type: CustomFieldType.SELECT,
    required: true,
    displayOrder: 29,
    defaultValue: 'standard',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'xinput_mapper', label: 'XInput Mapper' },
    ],
  },
]

export default async function gamenativeCustomFieldsSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding GameNative custom fields...')

  const gamenative = await prisma.emulator.findUnique({
    where: { name: GAMENATIVE_EMULATOR_NAME },
    select: { id: true },
  })

  if (!gamenative) {
    console.warn(
      `⚠️ Emulator "${GAMENATIVE_EMULATOR_NAME}" not found. Skipping custom field seeding.`,
    )
    return
  }

  const fieldNames = GAMENATIVE_CUSTOM_FIELDS.map((field) => field.name)
  const categoryIdByName = await syncCustomFieldCategories(
    prisma,
    gamenative.id,
    GAMENATIVE_CUSTOM_FIELD_CATEGORIES,
  )

  for (const field of GAMENATIVE_CUSTOM_FIELDS) {
    await prisma.customFieldDefinition.upsert({
      where: {
        emulatorId_name: {
          emulatorId: gamenative.id,
          name: field.name,
        },
      },
      create: buildDefinitionCreate(gamenative.id, field, categoryIdByName),
      update: buildDefinitionUpdate(field, categoryIdByName),
    })
  }

  const staleDefinitions = await prisma.customFieldDefinition.findMany({
    where: {
      emulatorId: gamenative.id,
      name: { notIn: fieldNames },
    },
    select: { id: true, name: true },
  })

  if (staleDefinitions.length > 0) {
    const valueCount = await prisma.listingCustomFieldValue.count({
      where: { customFieldDefinitionId: { in: staleDefinitions.map((d) => d.id) } },
    })
    const pcValueCount = await prisma.pcListingCustomFieldValue.count({
      where: { customFieldDefinitionId: { in: staleDefinitions.map((d) => d.id) } },
    })

    if (valueCount > 0 || pcValueCount > 0) {
      console.warn(
        `⚠️ Skipping removal of ${staleDefinitions.length} stale field(s) ` +
          `(${staleDefinitions.map((d) => d.name).join(', ')}) — ` +
          `${valueCount + pcValueCount} user-submitted values would be cascade-deleted. ` +
          `Remove manually after migrating data.`,
      )
    } else {
      await prisma.customFieldDefinition.deleteMany({
        where: { id: { in: staleDefinitions.map((d) => d.id) } },
      })
      console.info(`✅ Removed ${staleDefinitions.length} unused field definition(s).`)
    }
  }

  console.info(
    `✅ GameNative custom fields synced. Updated ${GAMENATIVE_CUSTOM_FIELDS.length} definitions.`,
  )
}

function buildDefinitionCreate(
  emulatorId: string,
  field: GameNativeCustomFieldSeed,
  categoryIdByName: ReadonlyMap<string, string>,
) {
  const { options, defaultValue, placeholder, ...base } = field
  const categoryConfig = GAMENATIVE_FIELD_CATEGORY_CONFIG[field.name]

  return {
    emulatorId,
    categoryId: resolveCategoryId(field.name, categoryConfig?.categoryName, categoryIdByName),
    name: base.name,
    label: base.label,
    type: base.type,
    options: normalizeJsonInput(options),
    defaultValue: normalizeJsonInput(defaultValue),
    placeholder: placeholder ?? null,
    rangeMin: null,
    rangeMax: null,
    rangeDecimals: null,
    rangeUnit: null,
    isRequired: base.required,
    displayOrder: base.displayOrder,
    categoryOrder: categoryConfig?.categoryOrder ?? 0,
  }
}

function buildDefinitionUpdate(
  field: GameNativeCustomFieldSeed,
  categoryIdByName: ReadonlyMap<string, string>,
) {
  const { options, defaultValue, placeholder, ...base } = field
  const categoryConfig = GAMENATIVE_FIELD_CATEGORY_CONFIG[field.name]

  return {
    categoryId: resolveCategoryId(field.name, categoryConfig?.categoryName, categoryIdByName),
    label: base.label,
    type: base.type,
    options: normalizeJsonInput(options),
    defaultValue: normalizeJsonInput(defaultValue),
    placeholder: placeholder ?? null,
    rangeMin: null,
    rangeMax: null,
    rangeDecimals: null,
    rangeUnit: null,
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
    throw new Error(`Missing GameNative custom field category "${categoryName}" for ${fieldName}`)
  }

  return categoryId
}

function normalizeJsonInput(
  value: unknown,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  return value === null || value === undefined ? Prisma.JsonNull : (value as Prisma.InputJsonValue)
}
