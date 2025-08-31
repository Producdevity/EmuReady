import { PAGINATION } from '@/data/constants'
import { ResourceError } from '@/lib/errors'
import { type PaginationResult, paginate, calculateOffset } from '@/server/utils/pagination'
import { Prisma } from '@orm'
import { BaseRepository } from './base.repository'
import type { GetCpusInput, CreateCpuInput, UpdateCpuInput } from '@/schemas/cpu'

/**
 * Repository for CPU data access
 */
export class CpusRepository extends BaseRepository {
  // Static query shapes for this repository
  static readonly includes = {
    default: {
      brand: true,
    } satisfies Prisma.CpuInclude,

    limited: {
      brand: { select: { id: true, name: true } },
    } satisfies Prisma.CpuInclude,

    withCounts: {
      brand: true,
      _count: { select: { pcListings: true } },
    } satisfies Prisma.CpuInclude,

    withCountsLimited: {
      brand: { select: { id: true, name: true } },
      _count: { select: { pcListings: true } },
    } satisfies Prisma.CpuInclude,
  } as const

  async byId(
    id: string,
    options: { limited?: boolean } = {},
  ): Promise<Prisma.CpuGetPayload<{
    include: typeof CpusRepository.includes.default | typeof CpusRepository.includes.limited
  }> | null> {
    return this.prisma.cpu.findUnique({
      where: { id },
      include: options.limited ? CpusRepository.includes.limited : CpusRepository.includes.default,
    })
  }

  /**
   * Get CPU by ID with counts
   */
  async byIdWithCounts(
    id: string,
    options: { limited?: boolean } = {},
  ): Promise<Prisma.CpuGetPayload<{
    include:
      | typeof CpusRepository.includes.withCounts
      | typeof CpusRepository.includes.withCountsLimited
  }> | null> {
    return this.prisma.cpu.findUnique({
      where: { id },
      include: options.limited
        ? CpusRepository.includes.withCountsLimited
        : CpusRepository.includes.withCounts,
    })
  }

  async create(
    data: CreateCpuInput,
  ): Promise<Prisma.CpuGetPayload<{ include: typeof CpusRepository.includes.default }>> {
    // Validate brand exists
    const brand = await this.prisma.deviceBrand.findUnique({
      where: { id: data.brandId },
    })
    if (!brand) throw ResourceError.deviceBrand.notFound()

    // Check for duplicate model name
    const exists = await this.existsByModelName(data.modelName)
    if (exists) throw ResourceError.cpu.alreadyExists(data.modelName)

    return this.prisma.cpu.create({
      data,
      include: CpusRepository.includes.default,
    })
  }

  async update(
    id: string,
    data: Partial<UpdateCpuInput>,
  ): Promise<Prisma.CpuGetPayload<{ include: typeof CpusRepository.includes.default }>> {
    // Check if CPU exists
    const cpu = await this.byId(id)
    if (!cpu) throw ResourceError.cpu.notFound()

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
      if (exists) throw ResourceError.cpu.alreadyExists(data.modelName)
    }

    return this.prisma.cpu.update({
      where: { id },
      data,
      include: CpusRepository.includes.default,
    })
  }

  async delete(id: string): Promise<void> {
    // Check if CPU exists and get usage count
    const existingCpu = await this.prisma.cpu.findUnique({
      where: { id },
      include: { _count: { select: { pcListings: true } } },
    })

    if (!existingCpu) throw ResourceError.cpu.notFound()

    // Check if CPU is in use
    if (existingCpu._count.pcListings > 0) {
      throw ResourceError.cpu.inUse(existingCpu._count.pcListings)
    }

    await this.prisma.cpu.delete({ where: { id } })
  }

  /**
   * Get total count with filters (for pagination)
   */
  async count(filters: GetCpusInput = {}): Promise<number> {
    const { search, brandId } = filters
    const where = this.buildWhereClause(search, brandId)
    return this.prisma.cpu.count({ where })
  }

  /**
   * Check if CPU model exists (for validation)
   */
  async existsByModelName(modelName: string, excludeId?: string): Promise<boolean> {
    const cpu = await this.prisma.cpu.findFirst({
      where: {
        modelName: { equals: modelName, mode: this.mode },
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !!cpu
  }

  /**
   * Get CPUs with PC listing counts - sorted by popularity
   */
  async listWithCounts(
    limit: number = 10,
  ): Promise<Prisma.CpuGetPayload<{ include: typeof CpusRepository.includes.withCounts }>[]> {
    return this.prisma.cpu.findMany({
      include: CpusRepository.includes.withCounts,
      orderBy: { pcListings: { _count: Prisma.SortOrder.desc } },
      take: limit,
    })
  }

  /**
   * Get CPUs with pagination metadata
   * Supports both web and mobile usage via options
   */
  async list(
    filters: GetCpusInput = {},
    options: { limited?: boolean } = {},
  ): Promise<{
    cpus: Prisma.CpuGetPayload<{
      include:
        | typeof CpusRepository.includes.withCounts
        | typeof CpusRepository.includes.withCountsLimited
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

    const [cpus, total] = await Promise.all([
      this.prisma.cpu.findMany({
        where,
        include: options.limited
          ? CpusRepository.includes.withCountsLimited
          : CpusRepository.includes.withCounts,
        orderBy,
        take: limit,
        skip: actualOffset,
      }),
      this.prisma.cpu.count({ where }),
    ])

    const pagination = paginate({
      total: total,
      page: page ?? Math.floor(actualOffset / limit) + 1,
      limit: limit,
    })

    return { cpus, pagination }
  }

  /**
   * Build where clause matching router logic exactly
   */
  private buildWhereClause(search?: string, brandId?: string): Prisma.CpuWhereInput {
    const where: Prisma.CpuWhereInput = {}

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
        // Brand + Model combination search (e.g., "Intel Core i7")
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
  ): Prisma.CpuOrderByWithRelationInput[] {
    const orderBy: Prisma.CpuOrderByWithRelationInput[] = []
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
