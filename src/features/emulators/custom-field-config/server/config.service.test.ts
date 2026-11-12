import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type UserActor } from '@/server/auth/actor'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { CustomFieldType, Role } from '@orm'
import { toConfigSnapshot } from './config.mapper'
import { CustomFieldConfigRepository } from './config.repository'
import { CustomFieldConfigService } from './config.service'
import { ConfigFieldSchema, type SaveCustomFieldConfig } from '../shared/config.schemas'
import { CATEGORY_ID, configRecord, FIELD_ID, TARGET_ID } from '../tests/fixtures'

vi.mock('@/server/db', () => ({ prisma: {} }))

const actor: UserActor = {
  type: 'user',
  userId: 'admin-id',
  role: Role.ADMIN,
  permissions: [PERMISSIONS.MANAGE_CUSTOM_FIELDS],
  showNsfw: false,
}

function setup() {
  const record = configRecord()
  const repository = new CustomFieldConfigRepository(prisma)
  const transaction = vi
    .spyOn(repository, 'transaction')
    .mockImplementation((operation) => operation(repository))
  const get = vi.spyOn(repository, 'getEmulator').mockResolvedValue(record)
  const saveCategory = vi.spyOn(repository, 'saveCategory').mockResolvedValue({ id: CATEGORY_ID })
  const saveField = vi.spyOn(repository, 'saveField').mockResolvedValue({ id: FIELD_ID })
  const removeFields = vi.spyOn(repository, 'removeFields').mockResolvedValue(undefined)
  const removeCategories = vi.spyOn(repository, 'removeCategories').mockResolvedValue(undefined)
  const input: SaveCustomFieldConfig = {
    emulatorId: TARGET_ID,
    configuration: toConfigSnapshot(record).configuration,
    expectedRevision: toConfigSnapshot(record).revision,
  }
  return {
    record,
    repository,
    transaction,
    get,
    saveCategory,
    saveField,
    removeFields,
    removeCategories,
    input,
    service: new CustomFieldConfigService(repository),
  }
}

describe('custom field configuration service', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('exports stable IDs for editing and includes empty categories', async () => {
    const s = setup()
    const result = await s.service.get(actor, TARGET_ID)
    expect(result.configuration.categories).toEqual([
      { id: CATEGORY_ID, name: 'Graphics', displayOrder: 0 },
      { id: '00000000-0000-4000-a000-000000000004', name: 'Advanced', displayOrder: 1 },
    ])
    expect(result.configuration.fields[0]?.category).toBe('Graphics')
    expect(result.configuration.fields[0]?.id).toBe(FIELD_ID)
  })

  it('maps pasted categories to destination IDs and removes omitted unused fields', async () => {
    const s = setup()
    s.input.configuration.fields = [
      ConfigFieldSchema.parse({
        name: 'new_field',
        label: 'New',
        type: CustomFieldType.BOOLEAN,
        defaultValue: false,
        category: 'Graphics',
        categoryOrder: 3,
      }),
    ]
    await s.service.save(actor, s.input)
    expect(s.transaction).toHaveBeenCalledOnce()
    expect(s.saveField).toHaveBeenCalledWith(
      TARGET_ID,
      expect.objectContaining({ name: 'new_field', defaultValue: false, categoryOrder: 3 }),
      CATEGORY_ID,
      undefined,
    )
    expect(s.removeFields).toHaveBeenCalledWith(TARGET_ID, [FIELD_ID])
  })

  it('rejects stale revisions before any writes', async () => {
    const s = setup()
    s.input.expectedRevision = '0'.repeat(64)
    await expect(s.service.save(actor, s.input)).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(s.saveCategory).not.toHaveBeenCalled()
    expect(s.saveField).not.toHaveBeenCalled()
  })

  it('requires permission before opening a write transaction', async () => {
    const s = setup()
    expect(() => s.service.save({ ...actor, permissions: [] }, s.input)).toThrow()
    expect(s.transaction).not.toHaveBeenCalled()
  })

  it('rejects unverified developers on the destination', async () => {
    const s = setup()
    await expect(s.service.save({ ...actor, role: Role.DEVELOPER }, s.input)).rejects.toMatchObject(
      { code: 'FORBIDDEN' },
    )
    expect(s.saveCategory).not.toHaveBeenCalled()
  })

  it('allows verified developers using the authenticated actor ID', async () => {
    const s = setup()
    s.record.verifiedDevelopers = [{ userId: actor.userId }]
    await s.service.save({ ...actor, role: Role.DEVELOPER }, s.input)
    expect(s.saveField).toHaveBeenCalledOnce()
  })

  it.each(['listingValues', 'pcListingValues'] as const)(
    'blocks incompatible types used by %s',
    async (kind) => {
      const s = setup()
      const existing = s.record.customFieldDefinitions[0]
      if (!existing) throw new Error('Missing test field')
      existing._count[kind] = 1
      s.input.configuration.fields = [
        ConfigFieldSchema.parse({
          name: 'renderer',
          label: 'Renderer',
          type: CustomFieldType.TEXT,
        }),
      ]
      await expect(s.service.save(actor, s.input)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('type'),
      })
      expect(s.saveCategory).not.toHaveBeenCalled()
    },
  )

  it('blocks option removal for populated fields but allows label edits', async () => {
    const s = setup()
    const existing = s.record.customFieldDefinitions[0]
    const field = s.input.configuration.fields[0]
    if (!existing || !field) throw new Error('Missing test field')
    existing._count.listingValues = 1
    field.options = [{ value: 'vulkan', label: 'Vulkan' }]
    await expect(s.service.save(actor, s.input)).rejects.toThrow('Cannot remove options')
    field.options.push({ value: 'opengl', label: 'OpenGL renamed' })
    field.label = 'Graphics API'
    await s.service.save(actor, s.input)
    expect(s.saveField).toHaveBeenCalledWith(
      TARGET_ID,
      expect.objectContaining({ label: 'Graphics API' }),
      CATEGORY_ID,
      FIELD_ID,
    )
  })

  it('rejects missing emulators', async () => {
    const s = setup()
    s.get.mockResolvedValue(null)
    await expect(s.service.save(actor, s.input)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('blocks narrowing populated ranges and permits widening them', async () => {
    const s = setup()
    const existing = s.record.customFieldDefinitions[0]
    if (!existing) throw new Error('Missing test field')
    Object.assign(existing, {
      type: CustomFieldType.RANGE,
      options: null,
      rangeMin: 0,
      rangeMax: 4,
      rangeDecimals: 1,
      defaultValue: 1,
    })
    existing._count.pcListingValues = 1
    const snapshot = toConfigSnapshot(s.record)
    s.input.configuration = snapshot.configuration
    s.input.expectedRevision = snapshot.revision
    const field = s.input.configuration.fields[0]
    if (!field) throw new Error('Missing test field')
    field.rangeMax = 2
    await expect(s.service.save(actor, s.input)).rejects.toThrow('Cannot narrow the range')
    expect(s.saveCategory).not.toHaveBeenCalled()
    field.rangeMax = 8
    await s.service.save(actor, s.input)
    expect(s.saveField).toHaveBeenCalledWith(
      TARGET_ID,
      expect.objectContaining({ rangeMax: 8 }),
      CATEGORY_ID,
      FIELD_ID,
    )
  })
  it('preserves field and category identity when renaming in JSON', async () => {
    const s = setup()
    const existing = s.record.customFieldDefinitions[0]
    const field = s.input.configuration.fields[0]
    const category = s.input.configuration.categories[0]
    if (!existing || !field || !category) throw new Error('Missing test configuration')
    existing._count.listingValues = 3
    field.name = 'graphics_api'
    field.category = 'Video'
    category.name = 'Video'
    category.displayOrder = 2
    await s.service.save(actor, s.input)
    expect(s.removeFields).toHaveBeenCalledWith(TARGET_ID, [])
    expect(s.saveCategory).toHaveBeenCalledWith(
      TARGET_ID,
      expect.objectContaining({ name: 'Video', displayOrder: 2 }),
      CATEGORY_ID,
    )
    expect(s.saveField).toHaveBeenCalledWith(
      TARGET_ID,
      expect.objectContaining({ name: 'graphics_api', category: 'Video' }),
      CATEGORY_ID,
      FIELD_ID,
    )
  })

  it.each(['listingValues', 'pcListingValues'] as const)(
    'blocks removal of fields used by %s before writing',
    async (kind) => {
      const s = setup()
      const existing = s.record.customFieldDefinitions[0]
      if (!existing) throw new Error('Missing test field')
      existing._count[kind] = 1
      s.input.configuration.fields = []
      await expect(s.service.save(actor, s.input)).rejects.toThrow('Cannot remove')
      expect(s.removeFields).not.toHaveBeenCalled()
      expect(s.removeCategories).not.toHaveBeenCalled()
      expect(s.saveCategory).not.toHaveBeenCalled()
    },
  )

  it('treats IDs from pasted configurations as portable metadata', async () => {
    const s = setup()
    const field = s.input.configuration.fields[0]
    const category = s.input.configuration.categories[0]
    if (!field || !category) throw new Error('Missing test configuration')
    field.id = '00000000-0000-4000-a000-000000000099'
    category.id = '00000000-0000-4000-a000-000000000098'
    await s.service.save(actor, s.input)
    expect(s.saveField).toHaveBeenCalledWith(TARGET_ID, field, CATEGORY_ID, FIELD_ID)
    expect(s.saveCategory).toHaveBeenCalledWith(TARGET_ID, category, CATEGORY_ID)
    expect(s.removeFields).toHaveBeenCalledWith(TARGET_ID, [])
  })

  it('rejects two JSON entries that resolve to the same existing field', async () => {
    const s = setup()
    const field = s.input.configuration.fields[0]
    if (!field) throw new Error('Missing test field')
    field.name = 'renamed'
    s.input.configuration.fields.push(
      ConfigFieldSchema.parse({ name: 'renderer', label: 'Duplicate', type: CustomFieldType.TEXT }),
    )
    await expect(s.service.save(actor, s.input)).rejects.toThrow('Multiple JSON items match')
    expect(s.removeFields).not.toHaveBeenCalled()
  })

  it('removes omitted categories after their fields are reassigned', async () => {
    const s = setup()
    const field = s.input.configuration.fields[0]
    if (!field) throw new Error('Missing test field')
    s.input.configuration.categories = []
    field.category = null
    await s.service.save(actor, s.input)
    expect(s.removeCategories).toHaveBeenCalledWith(
      TARGET_ID,
      s.record.customFieldCategories.map((category) => category.id),
    )
    expect(s.saveField).toHaveBeenCalledWith(TARGET_ID, field, null, FIELD_ID)
  })
})
