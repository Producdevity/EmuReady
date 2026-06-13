import { LOOKUP_PAGINATION } from '@/data/constants'
import { resolvePagination, type ResolvedPagination } from '@/server/utils/pagination'
import { Prisma } from '@orm/client'
import type {
  GetCpuOptionsInput,
  GetCpusInput,
  CpuSortField,
  MobileGetCpusInput,
  MobilePcListingCpusInput,
} from '../../shared/cpu.types'

type CpuOptionsFilters = NonNullable<GetCpuOptionsInput>
type MobilePcListingCpuFilters = MobilePcListingCpusInput
type CpuOrderByFactory = (direction: Prisma.SortOrder) => Prisma.CpuOrderByWithRelationInput[]

const CPU_QUERY_MODE = Prisma.QueryMode.insensitive
const CPU_DEFAULT_SORT = Prisma.SortOrder.asc
const CPU_ORDER_BY = {
  brand: (direction) => [{ brand: { name: direction } }],
  modelName: (direction) => [{ modelName: direction }],
  pcListings: (direction) => [{ pcListings: { _count: direction } }],
} satisfies Record<CpuSortField, CpuOrderByFactory>

export type CpuListQuery = {
  where: Prisma.CpuWhereInput
  orderBy: Prisma.CpuOrderByWithRelationInput[]
  pagination: ResolvedPagination
}

export type CpuOptionsQuery = {
  where: Prisma.CpuWhereInput
  orderBy: Prisma.CpuOrderByWithRelationInput[]
  limit: number
  offset: number
}

export type MobilePcListingCpuQuery = {
  where: Prisma.CpuWhereInput
  orderBy: Prisma.CpuOrderByWithRelationInput
  limit: number
}

export type CpuModelNameConflictQuery = {
  brandId: string
  modelName: string
  excludeId?: string
}

export function buildCpuListQuery(filters: GetCpusInput = {}): CpuListQuery {
  return {
    where: buildCpuWhere(filters?.search, filters?.brandId),
    orderBy: buildCpuOrderBy(filters?.sortField, filters?.sortDirection),
    pagination: resolvePagination(filters),
  }
}

export function buildCpuOptionsQuery(filters: CpuOptionsFilters = {}): CpuOptionsQuery {
  return {
    where: buildCpuWhere(filters.search, filters.brandId),
    orderBy: defaultCpuOrderBy(),
    limit: filters.limit ?? LOOKUP_PAGINATION.DEFAULT_LIMIT,
    offset: filters.offset ?? 0,
  }
}

export function buildMobileCpuListQuery(filters: MobileGetCpusInput = {}): CpuListQuery {
  return {
    where: buildMobileCpuCatalogCompatibilityWhere(filters?.search, filters?.brandId),
    orderBy: buildCpuOrderBy(filters?.sortField, filters?.sortDirection),
    pagination: resolvePagination(filters),
  }
}

export function buildMobilePcListingCpuQuery(
  filters: MobilePcListingCpuFilters,
): MobilePcListingCpuQuery {
  return {
    where: buildMobilePcListingCpuWhere(filters.search, filters.brandId),
    orderBy: { modelName: CPU_DEFAULT_SORT },
    limit: filters.limit ?? LOOKUP_PAGINATION.DEFAULT_LIMIT,
  }
}

export function buildCpuModelNameConflictWhere(
  query: CpuModelNameConflictQuery,
): Prisma.CpuWhereInput {
  return {
    brandId: query.brandId,
    modelName: { equals: query.modelName, mode: CPU_QUERY_MODE },
    ...(query.excludeId ? { id: { not: query.excludeId } } : {}),
  }
}

export function buildCpuWhere(search?: string, brandId?: string): Prisma.CpuWhereInput {
  const where: Prisma.CpuWhereInput = {}
  const query = search?.trim()

  if (brandId) where.brandId = brandId
  if (!query) return where

  const parts = query.split(/\s+/)
  const brandCandidate = parts[0]
  const modelCandidate = parts.slice(1).join(' ')

  where.OR = [
    { modelName: { equals: query, mode: CPU_QUERY_MODE } },
    { brand: { name: { equals: query, mode: CPU_QUERY_MODE } } },
    { modelName: { contains: query, mode: CPU_QUERY_MODE } },
    { brand: { name: { contains: query, mode: CPU_QUERY_MODE } } },
  ]

  if (brandCandidate && modelCandidate) {
    where.OR.push({
      AND: [
        { brand: { name: { contains: brandCandidate, mode: CPU_QUERY_MODE } } },
        { modelName: { contains: modelCandidate, mode: CPU_QUERY_MODE } },
      ],
    })
  }

  return where
}

// Preserves the pre-feature mobile/public CPU catalog search semantics until that API is versioned.
function buildMobileCpuCatalogCompatibilityWhere(
  search?: string,
  brandId?: string,
): Prisma.CpuWhereInput {
  const where: Prisma.CpuWhereInput = {}

  if (brandId) where.brandId = brandId

  if (search) {
    where.OR = [
      { modelName: { equals: search, mode: CPU_QUERY_MODE } },
      { brand: { name: { equals: search, mode: CPU_QUERY_MODE } } },
      { modelName: { contains: search, mode: CPU_QUERY_MODE } },
      { brand: { name: { contains: search, mode: CPU_QUERY_MODE } } },
    ]

    if (search.includes(' ')) {
      where.OR.push({
        AND: [
          { brand: { name: { contains: search.split(' ')[0], mode: CPU_QUERY_MODE } } },
          {
            modelName: { contains: search.split(' ').slice(1).join(' '), mode: CPU_QUERY_MODE },
          },
        ],
      })
    }
  }

  return where
}

function buildMobilePcListingCpuWhere(search?: string, brandId?: string): Prisma.CpuWhereInput {
  const where: Prisma.CpuWhereInput = {}

  if (brandId) where.brandId = brandId
  if (!search) return where

  where.OR = [
    { modelName: { contains: search, mode: CPU_QUERY_MODE } },
    { brand: { name: { contains: search, mode: CPU_QUERY_MODE } } },
  ]

  return where
}

export function buildCpuOrderBy(
  sortField?: CpuSortField | null,
  sortDirection?: Prisma.SortOrder | null,
): Prisma.CpuOrderByWithRelationInput[] {
  const direction = sortDirection ?? CPU_DEFAULT_SORT
  if (!sortField) return defaultCpuOrderBy()

  return CPU_ORDER_BY[sortField](direction)
}

function defaultCpuOrderBy(): Prisma.CpuOrderByWithRelationInput[] {
  return [{ brand: { name: CPU_DEFAULT_SORT } }, { modelName: CPU_DEFAULT_SORT }]
}
