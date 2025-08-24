import {
  calculateOffset,
  createPaginationResult,
  type PaginationResult,
} from '@/server/utils/pagination'
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

    withCounts: {
      brand: true,
      _count: {
        select: {
          pcListings: true,
        },
      },
    } satisfies Prisma.CpuInclude,
  } as const

  async byId(id: string): Promise<Prisma.CpuGetPayload<{ include: { brand: true } }> | null> {
    return this.prisma.cpu.findUnique({
      where: { id },
      include: CpusRepository.includes.default,
    })
  }

  /**
   * Get CPU by ID with counts (for web)
   */
  async byIdWithCounts(id: string): Promise<Prisma.CpuGetPayload<{
    include: {
      brand: true
      _count: {
        select: {
          pcListings: true
        }
      }
    }
  }> | null> {
    return this.prisma.cpu.findUnique({
      where: { id },
      include: CpusRepository.includes.withCounts,
    })
  }

  async create(data: CreateCpuInput): Promise<Prisma.CpuGetPayload<{ include: { brand: true } }>> {
    return this.prisma.cpu.create({
      data,
      include: CpusRepository.includes.default,
    })
  }

  async update(
    id: string,
    data: Partial<UpdateCpuInput>,
  ): Promise<Prisma.CpuGetPayload<{ include: { brand: true } }>> {
    return this.prisma.cpu.update({
      where: { id },
      data,
      include: CpusRepository.includes.default,
    })
  }

  async delete(id: string): Promise<void> {
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
  async getWithListingCounts(limit: number = 10): Promise<
    Prisma.CpuGetPayload<{
      include: {
        brand: true
        _count: {
          select: {
            pcListings: true
          }
        }
      }
    }>[]
  > {
    return this.prisma.cpu.findMany({
      include: CpusRepository.includes.withCounts,
      orderBy: { pcListings: { _count: Prisma.SortOrder.desc } },
      take: limit,
    })
  }

  /**
   * Get CPUs with pagination metadata (includes counts for web)
   * This is the main method that web routers should use
   */
  async getPaginated(filters: GetCpusInput = {}): Promise<{
    cpus: Prisma.CpuGetPayload<{
      include: {
        brand: true
        _count: {
          select: {
            pcListings: true
          }
        }
      }
    }>[]
    pagination: PaginationResult
  }> {
    const { search, brandId, limit = 20, offset = 0, page, sortField, sortDirection } = filters

    const actualOffset = calculateOffset({ page, offset }, limit)
    const where = this.buildWhereClause(search, brandId)
    const orderBy = this.buildOrderBy(sortField, sortDirection)

    const [cpus, total] = await Promise.all([
      this.prisma.cpu.findMany({
        where,
        include: CpusRepository.includes.withCounts,
        orderBy,
        take: limit,
        skip: actualOffset,
      }),
      this.prisma.cpu.count({ where }),
    ])

    const pagination = createPaginationResult(total, { page, offset }, limit, actualOffset)

    return { cpus, pagination }
  }

  /**
   * Get CPUs for mobile (with limited brand info)
   */
  async getMobile(filters: GetCpusInput = {}): Promise<{
    cpus: Prisma.CpuGetPayload<{
      include: {
        brand: { select: { id: true; name: true } }
      }
    }>[]
    pagination: PaginationResult
  }> {
    const { search, brandId, limit = 20, offset = 0, page, sortField, sortDirection } = filters

    const actualOffset = calculateOffset({ page, offset }, limit)
    const where = this.buildWhereClause(search, brandId)
    const orderBy = this.buildOrderBy(sortField, sortDirection)

    const [cpus, total] = await Promise.all([
      this.prisma.cpu.findMany({
        where,
        include: { brand: { select: { id: true, name: true } } },
        orderBy,
        take: limit,
        skip: actualOffset,
      }),
      this.prisma.cpu.count({ where }),
    ])

    const pagination = createPaginationResult(total, { page, offset }, limit, actualOffset)

    return { cpus, pagination }
  }

  /**
   * Get CPU by ID for mobile with limited brand info
   */
  async getByIdMobile(id: string): Promise<Prisma.CpuGetPayload<{
    include: { brand: { select: { id: true; name: true } } }
  }> | null> {
    return this.prisma.cpu.findUnique({
      where: { id },
      include: { brand: { select: { id: true, name: true } } },
    })
  }

  /**
   * Build where clause matching router logic exactly
   */
  private buildWhereClause(search?: string, brandId?: string): Prisma.CpuWhereInput {
    const where: Prisma.CpuWhereInput = {}

    if (brandId) {
      where.brandId = brandId
    }

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
