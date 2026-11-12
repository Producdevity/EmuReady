import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { CustomFieldType, Role } from '@orm'
import { toConfigSnapshot } from './config.mapper'
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

  it('requires the management permission', async () => {
    const service = vi.spyOn(CustomFieldConfigService.prototype, 'get')
    await expect(caller([]).get({ emulatorId: TARGET_ID })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(service).not.toHaveBeenCalled()
  })

  it('rejects source IDs and invalid input at the API boundary', async () => {
    const service = vi.spyOn(CustomFieldConfigService.prototype, 'apply')
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
    const service = vi
      .spyOn(CustomFieldConfigService.prototype, 'apply')
      .mockResolvedValue(snapshot)
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
