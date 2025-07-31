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
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationResult
}

/**
 * Calculate the actual offset from page number or direct offset
 * @param input - Pagination input containing either page or offset
 * @param limit - Number of items per page
 * @returns Calculated offset
 */
export function calculateOffset(input: PaginationInput, limit: number): number {
  const { page, offset = 0 } = input
  return page ? (page - 1) * limit : offset
}

/**
 * Create pagination metadata from query results
 * @param total - Total number of items
 * @param input - Original pagination input
 * @param limit - Number of items per page
 * @param actualOffset - Calculated offset used in query
 * @returns Pagination metadata
 */
export function createPaginationResult(
  total: number,
  input: PaginationInput,
  limit: number,
  actualOffset: number,
): PaginationResult {
  const pages = Math.ceil(total / limit)
  const page = input.page ?? Math.floor(actualOffset / limit) + 1

  return {
    total,
    pages,
    page,
    offset: actualOffset,
    limit,
  }
}

/**
 * Create a paginated response with items and pagination metadata
 * @param items - Array of items
 * @param total - Total count of items
 * @param input - Pagination input
 * @param limit - Items per page
 * @returns Paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  input: PaginationInput,
  limit: number,
): PaginatedResponse<T> {
  const actualOffset = calculateOffset(input, limit)
  const pagination = createPaginationResult(total, input, limit, actualOffset)

  return {
    items,
    pagination,
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

  return createPaginatedResponse(items, total, paginationInput, limit)
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

/**
 * Build orderBy clause from sort field and direction with type safety
 * @param sortConfig - Configuration for sort field mappings
 * @param sortField - Field to sort by
 * @param sortDirection - Sort direction (asc/desc)
 * @param defaultOrderBy - Default orderBy if no sort specified
 * @returns Prisma orderBy clause
 */
export function buildOrderBy<T = unknown>(
  sortConfig: Record<string, (direction: 'asc' | 'desc') => unknown>,
  sortField?: string,
  sortDirection?: 'asc' | 'desc',
  defaultOrderBy?: T | T[],
): T[] {
  const orderBy: T[] = []

  if (sortField && sortDirection && sortConfig[sortField]) {
    const sortResult = sortConfig[sortField](sortDirection)
    if (Array.isArray(sortResult)) {
      orderBy.push(...(sortResult as T[]))
    } else {
      orderBy.push(sortResult as T)
    }
  }

  // Add default ordering if no sort specified or as secondary sort
  if (defaultOrderBy) {
    if (orderBy.length === 0) {
      if (Array.isArray(defaultOrderBy)) {
        orderBy.push(...defaultOrderBy)
      } else {
        orderBy.push(defaultOrderBy)
      }
    } else if (sortField !== 'createdAt') {
      // Add createdAt as secondary sort for consistent ordering
      if (Array.isArray(defaultOrderBy)) {
        orderBy.push(...defaultOrderBy)
      } else {
        orderBy.push(defaultOrderBy)
      }
    }
  }

  return orderBy
}

/**
 * Build search conditions for multiple fields
 * @param searchTerm - Search term to match
 * @param fields - Array of field configurations for search
 * @returns Prisma OR conditions for search
 */
export function buildSearchConditions<T = unknown>(
  searchTerm: string,
  fields: Array<(term: string) => T>,
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
