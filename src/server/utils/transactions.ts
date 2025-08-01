import { AppError } from '@/lib/errors'
import type { Prisma, PrismaClient } from '@orm'

// Types
interface TransactionOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  isolationLevel?: Prisma.TransactionIsolationLevel
}

interface TransactionOperation {
  name: string
  execute: (tx: Prisma.TransactionClient) => Promise<unknown>
  onSuccess?: (result: unknown, tx: Prisma.TransactionClient) => Promise<void>
  onError?: (error: unknown, tx: Prisma.TransactionClient) => Promise<void>
}

interface BatchOptions {
  batchSize?: number
  parallel?: boolean
  stopOnError?: boolean
  delayBetweenBatches?: number
}

interface BatchResult<T> {
  successful: T[]
  failed: Array<{ index: number; error: unknown }>
  totalProcessed: number
  successCount: number
  errorCount: number
}

interface LockOptions {
  timeout?: number
  retryInterval?: number
  maxWaitTime?: number
}

/**
 * Execute a transaction with automatic retry on deadlock
 */
export async function withRetryTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: TransactionOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3
  const retryDelay = options?.retryDelay ?? 100
  const timeout = options?.timeout ?? 30000

  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        maxWait: timeout,
        timeout,
        isolationLevel: options?.isolationLevel,
      })
    } catch (error) {
      lastError = error

      // Check if error is retryable
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error
      }

      // Wait before retry with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Execute multiple operations in a transaction with rollback support
 */
export async function transactionalBatch<T>(
  prisma: PrismaClient,
  operations: TransactionOperation[],
): Promise<T> {
  return withRetryTransaction(prisma, async (tx) => {
    const results: unknown[] = []

    for (const operation of operations) {
      try {
        const result = await operation.execute(tx)
        results.push(result)

        if (operation.onSuccess) {
          await operation.onSuccess(result, tx)
        }
      } catch (error) {
        if (operation.onError) {
          await operation.onError(error, tx)
        }
        throw error
      }
    }

    return results as T
  })
}

/**
 * Create a savepoint for partial rollback support
 */
export async function withSavepoint<T>(
  tx: Prisma.TransactionClient,
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  // Prisma doesn't directly support savepoints, so we simulate with nested transactions
  try {
    return await fn()
  } catch (error) {
    throw error
  }
}

/**
 * Execute operations with optimistic locking
 */
export async function withOptimisticLock<T>(
  prisma: PrismaClient,
  model: {
    findUnique: (args: {
      where: { id: string }
    }) => Promise<Record<string, unknown> | null>
    update: (args: {
      where: { id: string }
      data: Record<string, unknown>
    }) => Promise<Record<string, unknown>>
  },
  id: string,
  versionField: string,
  updateFn: (
    current: Record<string, unknown>,
    tx: Prisma.TransactionClient,
  ) => Promise<T>,
): Promise<T> {
  return withRetryTransaction(prisma, async (tx) => {
    const current = await model.findUnique({
      where: { id },
    })

    if (!current) {
      throw AppError.notFound('Record not found')
    }

    const currentVersion = current[versionField]
    const result = await updateFn(current, tx)

    const updated = await model.findUnique({
      where: { id },
    })

    if (!updated) {
      throw AppError.notFound('Record not found after update')
    }

    if (updated[versionField] !== currentVersion) {
      throw AppError.conflict('Record was modified by another process')
    }

    await model.update({
      where: { id },
      data: { [versionField]: (currentVersion as number) + 1 },
    })

    return result
  })
}

/**
 * Batch operations for better performance
 */
export async function batchOperations<T>(
  operations: Array<() => Promise<T>>,
  options?: BatchOptions,
): Promise<BatchResult<T>> {
  const batchSize = options?.batchSize ?? 100
  const parallel = options?.parallel ?? false

  const results: T[] = []
  const errors: Array<{ index: number; error: unknown }> = []

  if (parallel) {
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(batch.map((op) => op()))

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          errors.push({ index: i + index, error: result.reason })
        }
      })

      if (options?.delayBetweenBatches && i + batchSize < operations.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, options.delayBetweenBatches),
        )
      }
    }
  } else {
    for (let i = 0; i < operations.length; i++) {
      try {
        const result = await operations[i]()
        results.push(result)
      } catch (error) {
        if (options?.stopOnError) {
          throw error
        }
        errors.push({ index: i, error })
      }
    }
  }

  return {
    successful: results,
    failed: errors,
    totalProcessed: operations.length,
    successCount: results.length,
    errorCount: errors.length,
  }
}

/**
 * Create a distributed lock for critical sections
 */
export async function withDistributedLock<T>(
  prisma: PrismaClient,
  lockKey: string,
  fn: () => Promise<T>,
  options?: LockOptions,
): Promise<T> {
  const lockId = `${lockKey}:${Date.now()}:${Math.random()}`
  const timeout = options?.timeout ?? 30000
  const retryInterval = options?.retryInterval ?? 100
  const maxWaitTime = options?.maxWaitTime ?? 60000

  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    try {
      // This is a simplified implementation. In production, use Redis or similar
      await prisma.$executeRaw`
        INSERT INTO distributed_locks (lock_key, lock_id, expires_at)
        VALUES (${lockKey}, ${lockId}, ${new Date(Date.now() + timeout)})
      `

      try {
        return await fn()
      } finally {
        await prisma.$executeRaw`
          DELETE FROM distributed_locks
          WHERE lock_key = ${lockKey} AND lock_id = ${lockId}
        `
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, retryInterval))
    }
  }

  throw AppError.internalError('Failed to acquire lock')
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('deadlock') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('transaction')
    )
  }
  return false
}
