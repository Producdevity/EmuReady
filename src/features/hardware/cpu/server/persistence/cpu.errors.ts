import { AppError, ResourceError } from '@/lib/errors'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'

export type CpuWriteContext = {
  action: 'create' | 'update' | 'delete'
  modelName?: string
}

export function translateCpuWriteError(error: unknown, context: CpuWriteContext): never {
  if (isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)) {
    throw ResourceError.cpu.alreadyExists(context.modelName ?? 'this model')
  }

  if (isPrismaError(error, PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION)) {
    if (context.action === 'delete') throw ResourceError.cpu.inUse()
    throw ResourceError.deviceBrand.notFound()
  }

  if (
    isPrismaError(error, PRISMA_ERROR_CODES.RECORD_NOT_FOUND) &&
    (context.action === 'update' || context.action === 'delete')
  ) {
    throw ResourceError.cpu.notFound()
  }

  throw AppError.databaseError(`CPU ${context.action}`)
}
