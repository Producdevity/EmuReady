import { toArray } from '@/utils/array'

export interface PaginationInput {
  limit?: number
  offset?: number
  page?: number
}

export interface PaginationResult {
  total: number
  pages: number
  page: number
  offset: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationResult
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

/**
 * Create pagination metadata - clean API
 * @param params - Pagination parameters
 * @returns Complete pagination metadata with calculated offset
 */
export function paginate(params: { total: number; page: number; limit: number }): PaginationResult {
  const { total, page, limit } = params
  const offset = (page - 1) * limit
  const pages = Math.ceil(total / limit)

  return {
    total,
    page,
    limit,
    pages,
    offset,
    hasNextPage: page < pages,
    hasPreviousPage: page > 1,
  }
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
 * Execute a paginated Prisma query with consistent pagination handling
 * @param model - Prisma model to query
 * @param args - Prisma findMany arguments (where, orderBy, include, etc.)
 * @param paginationInput - Pagination parameters
 * @param defaultLimit - Default items per page if not specified
 * @returns Paginated response
 */
export async function paginatedQuery<T>(
  model: {
    count: (args?: { where?: unknown }) => Promise<number>
    findMany: (args?: unknown) => Promise<T[]>
  },
  args: {
    where?: unknown
    orderBy?: unknown
    include?: unknown
    select?: unknown
  },
  paginationInput: PaginationInput,
  defaultLimit = 20,
): Promise<PaginatedResponse<T>> {
  const limit = paginationInput.limit ?? defaultLimit
  const actualOffset = calculateOffset(paginationInput, limit)

  // Execute count and findMany queries in parallel for better performance
  const [total, items] = await Promise.all([
    model.count({ where: args.where }),
    model.findMany({
      ...args,
      skip: actualOffset,
      take: limit,
    }),
  ])

  const { page } = paginationInput
  const actualPage = page ?? Math.floor(actualOffset / limit) + 1
  const pagination = paginate({ total, page: actualPage, limit })

  return {
    items,
    pagination,
  }
}

/**
 * Type-safe wrapper for paginated queries with Prisma
 * Ensures proper typing for the model and return type
 */
export function createPaginatedQueryWrapper<
  Model extends {
    count: (args?: { where?: unknown }) => Promise<number>
    findMany: (args?: unknown) => Promise<unknown[]>
  },
>() {
  return async function <T>(
    model: Model,
    args: Parameters<Model['findMany']>[0],
    paginationInput: PaginationInput,
    defaultLimit = 20,
  ): Promise<PaginatedResponse<T>> {
    return paginatedQuery<T>(
      model as {
        count: (args?: { where?: unknown }) => Promise<number>
        findMany: (args?: unknown) => Promise<T[]>
      },
      args as {
        where?: unknown
        orderBy?: unknown
        include?: unknown
        select?: unknown
      },
      paginationInput,
      defaultLimit,
    )
  }
}

export type SortDirection = 'asc' | 'desc'

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
