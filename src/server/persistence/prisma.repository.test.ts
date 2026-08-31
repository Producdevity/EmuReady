import { describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PrismaWriteRepository } from './prisma.repository'

type TestWriteContext = {
  action: 'write'
}

const mockPrisma = vi.hoisted(() => ({}))

vi.mock('@/server/db', () => ({ prisma: mockPrisma }))

class TestRepository extends PrismaWriteRepository<TestWriteContext> {
  executeTestWrite<T>(operation: () => Promise<T>): Promise<T> {
    return this.executeWrite(operation, { action: 'write' })
  }

  protected translateWriteError(error: unknown, context: TestWriteContext): never {
    if (error instanceof Error) {
      throw new Error(`${context.action}: ${error.message}`)
    }

    throw new Error(context.action)
  }
}

describe('PrismaWriteRepository', () => {
  it('returns the write operation result', async () => {
    const repository = new TestRepository(prisma)

    await expect(
      repository.executeTestWrite(() => Promise.resolve({ id: 'cpu-id' })),
    ).resolves.toEqual({ id: 'cpu-id' })
  })

  it('delegates write failures to the repository translator', async () => {
    const repository = new TestRepository(prisma)

    await expect(
      repository.executeTestWrite(() => Promise.reject(new Error('failed'))),
    ).rejects.toThrow('write: failed')
  })
})
