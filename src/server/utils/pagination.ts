import { PAGINATION } from '@/data/constants'
import { toArray } from '@/utils/array'
import type { PaginatedResponse, PaginationInput, PaginationResult } from '@/schemas/pagination'
import type { SortDirection } from '@/types/api'

export interface ResolvedPagination {
  limit: number
  offset: number
  page: number
}

/**
 * Calculate offset for database queries from pagination input
 * @param input - Pagination input with page or offset
 * @param limit - Items per page
 * @returns Calculated offset for database skip
 */
export function calculateOffset(
  input: { page?: number | null; offset?: number | null },
  limit: number,
): number {
  const { page, offset = 0 } = input
  return page ? (page - 1) * limit : (offset ?? 0)
}

export function resolvePagination(
  input: PaginationInput | undefined,
  defaultLimit = PAGINATION.DEFAULT_LIMIT,
): ResolvedPagination {
  const limit = input?.limit ?? defaultLimit
  const offset = calculateOffset({ page: input?.page, offset: input?.offset ?? 0 }, limit)

  return {
    limit,
    offset,
    page: input?.page ?? Math.floor(offset / limit) + 1,
  }
}

interface PaginateParams {
  total: number
  page: number
  limit: number
}
/**
 * Create pagination metadata - clean API
 * @param params - Pagination parameters
 * @returns Complete pagination metadata with calculated offset
 */
export function paginate(params: PaginateParams): PaginationResult {
  const offset = (params.page - 1) * params.limit
  const pages = Math.ceil(params.total / params.limit)

  return {
    total: params.total,
    page: params.page,
    limit: params.limit,
    pages,
    offset,
    hasNextPage: params.page < pages,
    hasPreviousPage: params.page > 1,
  }
}

export function paginationResult(total: number, pagination: ResolvedPagination): PaginationResult {
  return paginate({ total, page: pagination.page, limit: pagination.limit })
}

/**
 * Create a paginated response - clean API
 * @param params - Response parameters
 * @returns Paginated response with items and metadata
 */
export function paginatedResponse<T>(params: {
  items: T[]
  total: number
  page: number
  limit: number
}): PaginatedResponse<T> {
  const { items, total, page, limit } = params

  return {
    items,
    pagination: paginate({ total, page, limit }),
  }
}

/**
 * Build orderBy clause from sort field and direction
 * The generic type T represents the shape of orderBy objects
 * @param sortConfig - Configuration mapping field names to sort functions
 * @param sortField - Field to sort by
 * @param sortDirection - Sort direction (asc/desc)
 * @param defaultOrderBy - Default orderBy if no sort specified
 * @returns Array of orderBy clauses
 */
export function buildOrderBy<T>(
  sortConfig: Record<string, (direction: SortDirection) => T | T[]>,
  sortField?: string | null,
  sortDirection?: SortDirection | null,
  defaultOrderBy?: T | T[],
): T[] {
  const orderBy: T[] = []

  // Apply primary sort if valid
  if (sortField && sortDirection) {
    const sortFn = sortConfig[sortField]
    if (sortFn) {
      const sortResult = sortFn(sortDirection)
      orderBy.push(...toArray(sortResult))
    }
  }

  // Apply default ordering when appropriate
  if (shouldApplyDefaultSort(orderBy, sortField, defaultOrderBy)) {
    orderBy.push(...toArray(defaultOrderBy))
  }

  return orderBy
}

/**
 * Determine if default sort should be applied
 */
function shouldApplyDefaultSort<T>(
  orderBy: T[],
  sortField?: string | null,
  defaultOrderBy?: T | T[],
): defaultOrderBy is NonNullable<T | T[]> {
  if (!defaultOrderBy) return false

  // Apply default if no primary sort exists
  if (orderBy.length === 0) return true

  // Apply as secondary sort unless already sorting by createdAt
  return sortField !== 'createdAt'
}

/**
 * Build search conditions for multiple fields
 * @param searchTerm - Search term to match
 * @param fields - Array of field configurations for search
 * @returns Prisma OR conditions for search
 */
export function buildSearchConditions<T = unknown>(
  searchTerm: string,
  fields: ((term: string) => T)[],
): T[] {
  return fields.map((fieldConfig) => fieldConfig(searchTerm))
}

/**
 * Helper to create case-insensitive contains condition
 * @param field - Field path
 * @param value - Value to search
 * @returns Prisma condition object
 */
export function contains(field: string, value: string): unknown {
  const parts = field.split('.')

  let condition: Record<string, unknown> = {
    contains: value,
    mode: 'insensitive',
  }

  // Build nested condition from right to left
  for (let i = parts.length - 1; i >= 0; i--) {
    condition = { [parts[i]]: condition }
  }

  return condition
}
