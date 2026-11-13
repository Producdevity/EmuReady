import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { CustomFieldType, Role } from '@orm'
import { toConfigSnapshot } from './config.mapper'
import { CustomFieldConfigRepository } from './config.repository'
import { CustomFieldConfigService } from './config.service'
import { configRecord, TARGET_ID } from '../tests/fixtures'

vi.unmock('@/server/api/trpc')
vi.unmock('@orm/client')
vi.mock('@/server/db', () => ({ prisma: {} }))

const { customFieldConfigRouter } = await import('./config.router')

function caller(permissions: string[] = [PERMISSIONS.MANAGE_CUSTOM_FIELDS]) {
  return customFieldConfigRouter.createCaller({
    prisma,
    headers: new Headers(),
    session: {
      user: {
        id: 'authenticated-admin',
        name: 'Admin',
        email: 'admin@example.test',
        role: Role.ADMIN,
        permissions,
        showNsfw: false,
      },
    },
  })
}

describe('configuration transport', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('serves the versioned contract with categories', async () => {
    const snapshot = toConfigSnapshot(configRecord())
    vi.spyOn(CustomFieldConfigService.prototype, 'get').mockResolvedValue(snapshot)
    await expect(caller().get({ emulatorId: TARGET_ID })).resolves.toEqual(snapshot)
  })

  it.each(['get', 'save'] as const)(
    'names invalid stored fields in a BAD_REQUEST from %s',
    async (operation) => {
      const record = configRecord()
      const snapshot = toConfigSnapshot(record)
      const field = record.customFieldDefinitions[0]
      if (!field) throw new Error('Missing custom field fixture')
      field.defaultValue = 'removed-option'
      vi.spyOn(CustomFieldConfigRepository.prototype, 'getEmulator').mockResolvedValue(record)
      const saveField = vi.spyOn(CustomFieldConfigRepository.prototype, 'saveField')
      const saveCategory = vi.spyOn(CustomFieldConfigRepository.prototype, 'saveCategory')
      const request =
        operation === 'get'
          ? caller().get({ emulatorId: TARGET_ID })
          : caller().save({
              emulatorId: TARGET_ID,
              expectedRevision: snapshot.revision,
              configuration: snapshot.configuration,
            })

      await expect(request).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining(field.name),
      })
      expect(saveField).not.toHaveBeenCalled()
      expect(saveCategory).not.toHaveBeenCalled()
    },
  )

  it('names invalid stored categories instead of returning an internal error', async () => {
    const record = configRecord()
    const category = record.customFieldCategories[0]
    if (!category) throw new Error('Missing custom field category fixture')
    category.name = 'x'.repeat(101)
    vi.spyOn(CustomFieldConfigRepository.prototype, 'getEmulator').mockResolvedValue(record)

    await expect(caller().get({ emulatorId: TARGET_ID })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining(category.name),
    })
  })

  it('identifies the emulator when stored configuration violates cross-field rules', async () => {
    const record = configRecord()
    record.customFieldCategories.push({
      id: '00000000-0000-4000-a000-000000000099',
      name: 'Graphics',
      displayOrder: 2,
    })
    vi.spyOn(CustomFieldConfigRepository.prototype, 'getEmulator').mockResolvedValue(record)

    await expect(caller().get({ emulatorId: TARGET_ID })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining(TARGET_ID),
    })
  })

  it('requires the management permission', async () => {
    const service = vi.spyOn(CustomFieldConfigService.prototype, 'get')
    await expect(caller([]).get({ emulatorId: TARGET_ID })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(service).not.toHaveBeenCalled()
  })

  it('rejects malformed IDs and invalid input at the API boundary', async () => {
    const service = vi.spyOn(CustomFieldConfigService.prototype, 'save')
    const input = {
      emulatorId: TARGET_ID,
      expectedRevision: '0'.repeat(64),
      configuration: {
        version: 1 as const,
        categories: [],
        fields: [
          { id: 'source-field-id', name: 'test', label: 'Test', type: CustomFieldType.TEXT },
        ],
      },
    }
    await expect(caller().save(input)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(service).not.toHaveBeenCalled()
  })

  it('uses the session actor when applying a valid configuration', async () => {
    const snapshot = toConfigSnapshot(configRecord())
    const service = vi.spyOn(CustomFieldConfigService.prototype, 'save').mockResolvedValue(snapshot)
    await caller().save({
      emulatorId: TARGET_ID,
      expectedRevision: snapshot.revision,
      configuration: snapshot.configuration,
    })
    expect(service).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'authenticated-admin' }),
      expect.objectContaining({ emulatorId: TARGET_ID }),
    )
  })
})
