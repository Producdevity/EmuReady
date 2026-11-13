import { z } from 'zod'
import { LOOKUP_PAGINATION, PAGINATION } from '@/data/constants'

type PaginationInputSchemaOptions = {
  defaultLimit?: number
  maxLimit?: number
}

export const PaginationResultSchema = z.object({
  total: z.number().int().min(0),
  pages: z.number().int().min(0),
  page: z.number().int().positive(),
  offset: z.number().int().min(0),
  limit: z.number().int().positive(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
})

function createPaginationInputSchema(options: PaginationInputSchemaOptions = {}) {
  const defaultLimit = options.defaultLimit ?? PAGINATION.DEFAULT_LIMIT
  const maxLimit = options.maxLimit ?? PAGINATION.MAX_LIMIT

  return z.object({
    limit: z.number().int().min(1).max(maxLimit).default(defaultLimit),
    offset: z.number().int().safe().min(0).default(0),
    page: z.number().int().safe().min(1).optional(),
  })
}

function createOffsetPaginationInputSchema(options: PaginationInputSchemaOptions = {}) {
  const defaultLimit = options.defaultLimit ?? PAGINATION.DEFAULT_LIMIT
  const maxLimit = options.maxLimit ?? PAGINATION.MAX_LIMIT

  return z.object({
    limit: z.number().int().min(1).max(maxLimit).default(defaultLimit),
    offset: z.number().int().safe().min(0).default(0),
  })
}

export const PaginationInputSchema = createPaginationInputSchema()
export const LookupPaginationInputSchema = createOffsetPaginationInputSchema({
  defaultLimit: LOOKUP_PAGINATION.DEFAULT_LIMIT,
  maxLimit: LOOKUP_PAGINATION.MAX_LIMIT,
})

export function refinePaginationOffset(
  input: Pick<PaginationInput, 'page' | 'limit' | 'offset'>,
  context: z.RefinementCtx,
  issuePath?: z.IssueData['path'],
) {
  const limit = input.limit ?? PAGINATION.DEFAULT_LIMIT
  const offset = input.page ? (input.page - 1) * limit : (input.offset ?? 0)
  if (offset < 0 || !Number.isSafeInteger(offset)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        offset < 0
          ? 'Pagination offset must not be negative'
          : 'Pagination offset exceeds the supported range',
      path: issuePath ?? (input.page ? ['page'] : ['offset']),
    })
  }
}

export type PaginationResult = z.output<typeof PaginationResultSchema>
export type PaginationInput = z.input<typeof PaginationInputSchema>
export type PaginatedResponse<T> = {
  items: T[]
  pagination: PaginationResult
}
