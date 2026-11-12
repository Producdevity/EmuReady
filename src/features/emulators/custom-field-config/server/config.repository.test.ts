import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { Prisma } from '@orm/client'
import { CustomFieldConfigRepository } from './config.repository'
import { ConfigFieldSchema } from '../shared/config.schemas'
import { TARGET_ID } from '../tests/fixtures'

vi.unmock('@orm/client')
const database = vi.hoisted(() => ({
  $transaction: vi.fn(),
  customFieldDefinition: { upsert: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

describe('configuration persistence', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses serializable transactions and translates conflicts', async () => {
    const error = Object.assign(new Error('write conflict'), { code: 'P2034' })
    database.$transaction.mockRejectedValue(error)
    const repository = new CustomFieldConfigRepository(prisma)
    await expect(repository.transaction(async () => undefined)).rejects.toMatchObject({
      code: 'CONFLICT',
    })
    expect(database.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30_000,
    })
  })

  it('preserves field identity and false values, and clears nullable settings explicitly', async () => {
    const repository = new CustomFieldConfigRepository(prisma)
    const field = ConfigFieldSchema.parse({
      name: 'async_shader',
      label: 'Async shader',
      type: 'BOOLEAN',
      defaultValue: false,
    })
    await repository.saveField(TARGET_ID, field, null)
    expect(database.customFieldDefinition.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { emulatorId_name: { emulatorId: TARGET_ID, name: 'async_shader' } },
        update: expect.objectContaining({
          defaultValue: false,
          options: Prisma.DbNull,
          categoryId: null,
          placeholder: null,
          rangeMin: null,
        }),
      }),
    )
  })
})
