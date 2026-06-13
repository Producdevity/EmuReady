import { LOOKUP_PAGINATION } from '@/data/constants'
import { resolvePagination, type ResolvedPagination } from '@/server/utils/pagination'
import { Prisma } from '@orm/client'
import type {
  GetGpuOptionsInput,
  GetGpusInput,
  GpuSortField,
  MobileGetGpusInput,
  MobilePcListingGpusInput,
} from '../../shared/gpu.types'

type GpuOptionsFilters = NonNullable<GetGpuOptionsInput>
type MobilePcListingGpuFilters = MobilePcListingGpusInput
type GpuOrderByFactory = (direction: Prisma.SortOrder) => Prisma.GpuOrderByWithRelationInput[]

const GPU_QUERY_MODE = Prisma.QueryMode.insensitive
const GPU_DEFAULT_SORT = Prisma.SortOrder.asc
const GPU_ORDER_BY = {
  brand: (direction) => [{ brand: { name: direction } }],
  modelName: (direction) => [{ modelName: direction }],
  pcListings: (direction) => [{ pcListings: { _count: direction } }],
} satisfies Record<GpuSortField, GpuOrderByFactory>

export type GpuListQuery = {
  where: Prisma.GpuWhereInput
  orderBy: Prisma.GpuOrderByWithRelationInput[]
  pagination: ResolvedPagination
}

export type GpuOptionsQuery = {
  where: Prisma.GpuWhereInput
  orderBy: Prisma.GpuOrderByWithRelationInput[]
  limit: number
  offset: number
}

export type MobilePcListingGpuQuery = {
  where: Prisma.GpuWhereInput
  orderBy: Prisma.GpuOrderByWithRelationInput
  limit: number
}

export type GpuModelNameConflictQuery = {
  brandId: string
  modelName: string
  excludeId?: string
}

export function buildGpuListQuery(filters: GetGpusInput = {}): GpuListQuery {
  return {
    where: buildGpuWhere(filters?.search, filters?.brandId),
    orderBy: buildGpuOrderBy(filters?.sortField, filters?.sortDirection),
    pagination: resolvePagination(filters),
  }
}

export function buildGpuOptionsQuery(filters: GpuOptionsFilters = {}): GpuOptionsQuery {
  return {
    where: buildGpuWhere(filters.search, filters.brandId),
    orderBy: defaultGpuOrderBy(),
    limit: filters.limit ?? LOOKUP_PAGINATION.DEFAULT_LIMIT,
    offset: filters.offset ?? 0,
  }
}

export function buildMobileGpuListQuery(filters: MobileGetGpusInput = {}): GpuListQuery {
  return {
    where: buildMobileGpuCatalogCompatibilityWhere(filters?.search, filters?.brandId),
    orderBy: buildGpuOrderBy(filters?.sortField, filters?.sortDirection),
    pagination: resolvePagination(filters),
  }
}

export function buildMobilePcListingGpuQuery(
  filters: MobilePcListingGpuFilters,
): MobilePcListingGpuQuery {
  return {
    where: buildMobilePcListingGpuWhere(filters.search, filters.brandId),
    orderBy: { modelName: GPU_DEFAULT_SORT },
    limit: filters.limit ?? LOOKUP_PAGINATION.DEFAULT_LIMIT,
  }
}

export function buildGpuModelNameConflictWhere(
  query: GpuModelNameConflictQuery,
): Prisma.GpuWhereInput {
  return {
    brandId: query.brandId,
    modelName: { equals: query.modelName, mode: GPU_QUERY_MODE },
    ...(query.excludeId ? { id: { not: query.excludeId } } : {}),
  }
}

export function buildGpuWhere(search?: string, brandId?: string): Prisma.GpuWhereInput {
  const where: Prisma.GpuWhereInput = {}
  const query = search?.trim()

  if (brandId) where.brandId = brandId
  if (!query) return where

  const parts = query.split(/\s+/)
  const brandCandidate = parts[0]
  const modelCandidate = parts.slice(1).join(' ')

  where.OR = [
    { modelName: { equals: query, mode: GPU_QUERY_MODE } },
    { brand: { name: { equals: query, mode: GPU_QUERY_MODE } } },
    { modelName: { contains: query, mode: GPU_QUERY_MODE } },
    { brand: { name: { contains: query, mode: GPU_QUERY_MODE } } },
  ]

  if (brandCandidate && modelCandidate) {
    where.OR.push({
      AND: [
        { brand: { name: { contains: brandCandidate, mode: GPU_QUERY_MODE } } },
        { modelName: { contains: modelCandidate, mode: GPU_QUERY_MODE } },
      ],
    })
  }

  return where
}

//
/**
 * Preserves the pre-feature mobile/public GPU catalog search semantics until that API is versioned.
 * @deprecated
 */
function buildMobileGpuCatalogCompatibilityWhere(
  search?: string,
  brandId?: string,
): Prisma.GpuWhereInput {
  const where: Prisma.GpuWhereInput = {}

  if (brandId) where.brandId = brandId

  if (search) {
    where.OR = [
      { modelName: { equals: search, mode: GPU_QUERY_MODE } },
      { brand: { name: { equals: search, mode: GPU_QUERY_MODE } } },
      { modelName: { contains: search, mode: GPU_QUERY_MODE } },
      { brand: { name: { contains: search, mode: GPU_QUERY_MODE } } },
    ]

    if (search.includes(' ')) {
      where.OR.push({
        AND: [
          { brand: { name: { contains: search.split(' ')[0], mode: GPU_QUERY_MODE } } },
          {
            modelName: { contains: search.split(' ').slice(1).join(' '), mode: GPU_QUERY_MODE },
          },
        ],
      })
    }
  }

  return where
}

function buildMobilePcListingGpuWhere(search?: string, brandId?: string): Prisma.GpuWhereInput {
  const where: Prisma.GpuWhereInput = {}

  if (brandId) where.brandId = brandId
  if (!search) return where

  where.OR = [
    { modelName: { contains: search, mode: GPU_QUERY_MODE } },
    { brand: { name: { contains: search, mode: GPU_QUERY_MODE } } },
  ]

  return where
}

export function buildGpuOrderBy(
  sortField?: GpuSortField | null,
  sortDirection?: Prisma.SortOrder | null,
): Prisma.GpuOrderByWithRelationInput[] {
  const direction = sortDirection ?? GPU_DEFAULT_SORT
  if (!sortField) return defaultGpuOrderBy()

  return GPU_ORDER_BY[sortField](direction)
}

function defaultGpuOrderBy(): Prisma.GpuOrderByWithRelationInput[] {
  return [{ brand: { name: GPU_DEFAULT_SORT } }, { modelName: GPU_DEFAULT_SORT }]
}
