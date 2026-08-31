import { AppError, ResourceError } from '@/lib/errors'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'

export type GpuWriteContext = {
  action: 'create' | 'update' | 'delete'
  modelName?: string
}

export function translateGpuWriteError(error: unknown, context: GpuWriteContext): never {
  if (isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)) {
    throw ResourceError.gpu.alreadyExists(context.modelName ?? 'this model')
  }

  if (isPrismaError(error, PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION)) {
    if (context.action === 'delete') throw ResourceError.gpu.inUse()
    throw ResourceError.deviceBrand.notFound()
  }

  if (
    isPrismaError(error, PRISMA_ERROR_CODES.RECORD_NOT_FOUND) &&
    (context.action === 'update' || context.action === 'delete')
  ) {
    throw ResourceError.gpu.notFound()
  }

  throw AppError.databaseError(`GPU ${context.action}`)
}
