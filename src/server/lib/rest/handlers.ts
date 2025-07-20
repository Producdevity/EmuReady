import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { type BaseService } from '@/server/services/base.service'
import { type PrismaClient } from '@orm'
import { apiError, paginatedResponse, apiResponse } from './response'
import { parseQuery } from './validation'

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
})

export function createListHandler<T extends BaseService<unknown, unknown>>(
  ServiceClass: new (prisma: PrismaClient) => T,
  querySchema = PaginationQuerySchema,
) {
  return async (request: NextRequest) => {
    try {
      const params = parseQuery(request.nextUrl.searchParams, querySchema)
      const service = new ServiceClass(prisma)
      const result = await service.findMany(params)
      return paginatedResponse(result.items, result.pagination)
    } catch (error) {
      return apiError(error)
    }
  }
}

export function createGetByIdHandler<T extends BaseService<unknown, unknown>>(
  ServiceClass: new (prisma: PrismaClient) => T,
) {
  return async (
    request: NextRequest,
    { params }: { params: { id: string } },
  ) => {
    try {
      const { id } = params
      const service = new ServiceClass(prisma)
      const item = await service.findById(id)

      if (!item) {
        return apiError({
          code: 'NOT_FOUND',
          message: 'Resource not found',
        })
      }

      return apiResponse(item)
    } catch (error) {
      return apiError(error)
    }
  }
}
