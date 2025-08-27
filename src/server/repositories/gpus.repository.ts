import { PAGINATION } from '@/data/constants'
import { ResourceError } from '@/lib/errors'
import {
  calculateOffset,
  createPaginationResult,
  type PaginationResult,
} from '@/server/utils/pagination'
import { Prisma } from '@orm'
import { BaseRepository } from './base.repository'
import type { GetGpusInput, CreateGpuInput, UpdateGpuInput } from '@/schemas/gpu'

/**
 * Repository for GPU data access
 */
export class GpusRepository extends BaseRepository {
  // Static query shapes for this repository
  static readonly includes = {
    default: {
      brand: true,
    } satisfies Prisma.GpuInclude,

    limited: {
      brand: { select: { id: true, name: true } },
    } satisfies Prisma.GpuInclude,

    withCounts: {
      brand: true,
      _count: {
        select: {
          pcListings: true,
        },
      },
    } satisfies Prisma.GpuInclude,

    withCountsLimited: {
      brand: { select: { id: true, name: true } },
      _count: {
        select: {
          pcListings: true,
        },
      },
    } satisfies Prisma.GpuInclude,
  } as const

  async byId(
    id: string,
    options: { limited?: boolean } = {},
  ): Promise<Prisma.GpuGetPayload<{
    include: typeof GpusRepository.includes.default | typeof GpusRepository.includes.limited
  }> | null> {
    return this.prisma.gpu.findUnique({
      where: { id },
      include: options.limited ? GpusRepository.includes.limited : GpusRepository.includes.default,
    })
  }

  /**
   * Get GPU by ID with counts
   */
  async byIdWithCounts(
    id: string,
    options: { limited?: boolean } = {},
  ): Promise<Prisma.GpuGetPayload<{
    include:
      | typeof GpusRepository.includes.withCounts
      | typeof GpusRepository.includes.withCountsLimited
  }> | null> {
    return this.prisma.gpu.findUnique({
      where: { id },
      include: options.limited
        ? GpusRepository.includes.withCountsLimited
        : GpusRepository.includes.withCounts,
    })
  }

  async create(
    data: CreateGpuInput,
  ): Promise<Prisma.GpuGetPayload<{ include: typeof GpusRepository.includes.default }>> {
    // Validate brand exists
    const brand = await this.prisma.deviceBrand.findUnique({
      where: { id: data.brandId },
    })
    if (!brand) throw ResourceError.deviceBrand.notFound()

    // Check for duplicate model name
    const exists = await this.existsByModelName(data.modelName)
    if (exists) throw ResourceError.gpu.alreadyExists(data.modelName)

    return this.prisma.gpu.create({
      data,
      include: GpusRepository.includes.default,
    })
  }

  async update(
    id: string,
    data: Partial<UpdateGpuInput>,
  ): Promise<Prisma.GpuGetPayload<{ include: typeof GpusRepository.includes.default }>> {
    // Check if GPU exists
    const gpu = await this.byId(id)
    if (!gpu) throw ResourceError.gpu.notFound()

    // Validate brand exists if being updated
    if (data.brandId) {
      const brand = await this.prisma.deviceBrand.findUnique({
        where: { id: data.brandId },
      })
      if (!brand) throw ResourceError.deviceBrand.notFound()
    }

    // Check for duplicate model name if being updated
    if (data.modelName) {
      const exists = await this.existsByModelName(data.modelName, id)
      if (exists) throw ResourceError.gpu.alreadyExists(data.modelName)
    }

    return this.prisma.gpu.update({
      where: { id },
      data,
      include: GpusRepository.includes.default,
    })
  }

  async delete(id: string): Promise<void> {
    // Check if GPU exists and get usage count
    const existingGpu = await this.prisma.gpu.findUnique({
      where: { id },
      include: { _count: { select: { pcListings: true } } },
    })

    if (!existingGpu) throw ResourceError.gpu.notFound()

    // Check if GPU is in use
    if (existingGpu._count.pcListings > 0) {
      throw ResourceError.gpu.inUse(existingGpu._count.pcListings)
    }

    await this.prisma.gpu.delete({ where: { id } })
  }

  /**
   * Get total count with filters (for pagination)
   */
  async count(filters: GetGpusInput = {}): Promise<number> {
    const { search, brandId } = filters
    const where = this.buildWhereClause(search, brandId)
    return this.prisma.gpu.count({ where })
  }

  /**
   * Check if GPU model exists (for validation)
   */
  async existsByModelName(modelName: string, excludeId?: string): Promise<boolean> {
    const gpu = await this.prisma.gpu.findFirst({
      where: {
        modelName: { equals: modelName, mode: this.mode },
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !!gpu
  }

  /**
   * Get GPUs with PC listing counts
   */
  async listWithCounts(
    limit: number = 10,
  ): Promise<Prisma.GpuGetPayload<{ include: typeof GpusRepository.includes.withCounts }>[]> {
    return this.prisma.gpu.findMany({
      include: GpusRepository.includes.withCounts,
      orderBy: { pcListings: { _count: Prisma.SortOrder.desc } },
      take: limit,
    })
  }

  /**
   * Get GPUs with pagination metadata
   * Supports both web and mobile usage via options
   */
  async list(
    filters: GetGpusInput = {},
    options: { limited?: boolean } = {},
  ): Promise<{
    gpus: Prisma.GpuGetPayload<{
      include:
        | typeof GpusRepository.includes.withCounts
        | typeof GpusRepository.includes.withCountsLimited
    }>[]
    pagination: PaginationResult
  }> {
    const {
      search,
      brandId,
      limit = PAGINATION.DEFAULT_LIMIT,
      offset = 0,
      page,
      sortField,
      sortDirection,
    } = filters

    const actualOffset = calculateOffset({ page, offset }, limit)
    const where = this.buildWhereClause(search, brandId)
    const orderBy = this.buildOrderBy(sortField, sortDirection)

    const [gpus, total] = await Promise.all([
      this.prisma.gpu.findMany({
        where,
        include: options.limited
          ? GpusRepository.includes.withCountsLimited
          : GpusRepository.includes.withCounts,
        orderBy,
        take: limit,
        skip: actualOffset,
      }),
      this.prisma.gpu.count({ where }),
    ])

    const pagination = createPaginationResult(total, { page, offset }, limit, actualOffset)

    return { gpus, pagination }
  }

  private buildWhereClause(search?: string, brandId?: string): Prisma.GpuWhereInput {
    const where: Prisma.GpuWhereInput = {}

    if (brandId) where.brandId = brandId

    if (search) {
      where.OR = [
        // Exact match for model name (highest priority)
        { modelName: { equals: search, mode: this.mode } },
        // Exact match for brand name
        { brand: { name: { equals: search, mode: this.mode } } },
        // Contains match for model name
        { modelName: { contains: search, mode: this.mode } },
        // Contains match for brand name
        { brand: { name: { contains: search, mode: this.mode } } },
        // Brand + Model combination search (e.g., "NVIDIA RTX 4090")
        ...(search.includes(' ')
          ? [
              {
                AND: [
                  { brand: { name: { contains: search.split(' ')[0], mode: this.mode } } },
                  {
                    modelName: { contains: search.split(' ').slice(1).join(' '), mode: this.mode },
                  },
                ],
              },
            ]
          : []),
      ]
    }

    return where
  }

  /**
   * Build orderBy clause matching router logic
   */
  private buildOrderBy(
    sortField?: string | null,
    sortDirection?: Prisma.SortOrder | null,
  ): Prisma.GpuOrderByWithRelationInput[] {
    const orderBy: Prisma.GpuOrderByWithRelationInput[] = []
    const direction = sortDirection || this.sortOrder

    if (sortField) {
      switch (sortField) {
        case 'brand':
          orderBy.push({ brand: { name: direction } })
          break
        case 'modelName':
          orderBy.push({ modelName: direction })
          break
        case 'pcListings':
          orderBy.push({ pcListings: { _count: direction } })
          break
      }
    }

    // Default ordering if no sort specified
    if (!orderBy.length) {
      orderBy.push({ brand: { name: this.sortOrder } }, { modelName: this.sortOrder })
    }

    return orderBy
  }
}
