import { TRPCError } from '@trpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSerializableAppError } from '@/lib/app-error-cause'
import { type PrismaClient } from '@orm/client'
import { BaseRepository } from './base.repository'

const mocks = vi.hoisted(() => ({ error: vi.fn() }))
vi.mock('@/lib/logger', () => ({ logger: { error: mocks.error } }))

vi.mock('@orm/client', async () => {
  const actual = await import('@orm/client')
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      QueryMode: { insensitive: 'insensitive' },
      SortOrder: { asc: 'asc', desc: 'desc' },
    },
  }
})

type BatchQueryFn = (params: {
  cursor?: { id: string }
  take: number
  skip?: number
}) => Promise<{ id: string }[]>

class TestRepository extends BaseRepository {
  execute(operation: () => Promise<unknown>) {
    return this.handleDatabaseOperation(operation, 'test operation')
  }

  async *iterateBatches<T extends { id: string }>(
    queryFn: (params: { cursor?: { id: string }; take: number; skip?: number }) => Promise<T[]>,
    batchSize?: number,
  ) {
    yield* this.cursorBatchIterator(queryFn, batchSize)
  }
}

function createMockPrisma() {
  return {} as unknown as PrismaClient
}

describe('BaseRepository', () => {
  let repository: TestRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new TestRepository(createMockPrisma())
  })

  it('preserves the logged diagnostic cause without exposing provider metadata to clients', async () => {
    const providerError = Object.assign(new Error('Connection failed'), {
      code: 'ECONNRESET',
      metadata: 'server-only diagnostic',
    })
    try {
      await repository.execute(() => Promise.reject(providerError))
      throw new Error('Expected the database operation to fail')
    } catch (error) {
      if (!(error instanceof TRPCError) || !error.cause) throw error
      expect(error.message).toBe('Database error during test operation')
      expect(error.cause.cause).toBe(providerError)
      expect(getSerializableAppError(error.cause)).toBeNull()
      expect(mocks.error).toHaveBeenCalledExactlyOnceWith(
        '[BaseRepository] Database error',
        error.cause,
        { context: 'test operation' },
      )
    }
  })

  describe('cursorBatchIterator', () => {
    it('should yield all batches correctly across multiple pages', async () => {
      const batch1 = [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }]
      const batch2 = [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }]
      const batch3 = [{ id: 'c1' }]

      const queryFn = vi
        .fn<BatchQueryFn>()
        .mockResolvedValueOnce(batch1)
        .mockResolvedValueOnce(batch2)
        .mockResolvedValueOnce(batch3)

      const batches: { id: string }[][] = []
      for await (const batch of repository.iterateBatches(queryFn, 3)) {
        batches.push(batch)
      }

      expect(batches).toEqual([batch1, batch2, batch3])
      expect(queryFn).toHaveBeenCalledTimes(3)
    })

    it('should handle empty result set (no records)', async () => {
      const queryFn = vi.fn<BatchQueryFn>().mockResolvedValueOnce([])

      const batches: { id: string }[][] = []
      for await (const batch of repository.iterateBatches(queryFn, 10)) {
        batches.push(batch)
      }

      expect(batches).toEqual([])
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should stop when batch size is less than batchSize', async () => {
      const batch1 = [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }]
      const batch2 = [{ id: 'b1' }]

      const queryFn = vi
        .fn<BatchQueryFn>()
        .mockResolvedValueOnce(batch1)
        .mockResolvedValueOnce(batch2)

      const batches: { id: string }[][] = []
      for await (const batch of repository.iterateBatches(queryFn, 3)) {
        batches.push(batch)
      }

      expect(batches).toEqual([batch1, batch2])
      expect(queryFn).toHaveBeenCalledTimes(2)
    })

    it('should use cursor pagination correctly (skip:1 after first batch)', async () => {
      const batch1 = [{ id: 'first-id' }, { id: 'second-id' }]
      const batch2 = [{ id: 'third-id' }]

      const queryFn = vi
        .fn<BatchQueryFn>()
        .mockResolvedValueOnce(batch1)
        .mockResolvedValueOnce(batch2)

      const batches: { id: string }[][] = []
      for await (const batch of repository.iterateBatches(queryFn, 2)) {
        batches.push(batch)
      }

      expect(queryFn).toHaveBeenNthCalledWith(1, { take: 2 })
      expect(queryFn).toHaveBeenNthCalledWith(2, { take: 2, cursor: { id: 'second-id' }, skip: 1 })

      expect(batches.length).toEqual(2)
    })

    it('should stop when first batch is exactly batchSize but next is empty', async () => {
      const batch1 = [{ id: 'a1' }, { id: 'a2' }]

      const queryFn = vi.fn<BatchQueryFn>().mockResolvedValueOnce(batch1).mockResolvedValueOnce([])

      const batches: { id: string }[][] = []
      for await (const batch of repository.iterateBatches(queryFn, 2)) {
        batches.push(batch)
      }

      expect(batches).toEqual([batch1])
      expect(queryFn).toHaveBeenCalledTimes(2)
    })
  })
})
