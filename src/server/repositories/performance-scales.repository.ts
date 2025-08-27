import { ResourceError } from '@/lib/errors'
import { Prisma, type PerformanceScale } from '@orm'
import { BaseRepository } from './base.repository'
import type {
  GetPerformanceScalesInput,
  CreatePerformanceScaleInput,
  UpdatePerformanceScaleInput,
} from '@/schemas/performanceScale'

/**
 * Repository for PerformanceScale data access
 * Note: PerformanceScale uses numeric IDs instead of UUIDs
 * We override the base class methods to use number instead of string for IDs
 */
export class PerformanceScalesRepository extends BaseRepository {
  // Static query shapes for this repository
  static readonly includes = {
    default: {} satisfies Prisma.PerformanceScaleInclude,

    withCounts: {
      _count: { select: { listings: true, pcListings: true } },
    } satisfies Prisma.PerformanceScaleInclude,
  } as const

  async list(filters: GetPerformanceScalesInput = {}): Promise<PerformanceScale[]> {
    const { search, sortField = 'rank', sortDirection } = filters

    const where: Prisma.PerformanceScaleWhereInput = {
      ...(search && {
        OR: [
          { label: { contains: search, mode: this.mode } },
          { description: { contains: search, mode: this.mode } },
        ],
      }),
    }

    // Map schema sort fields to Prisma orderBy
    const orderBy: Prisma.PerformanceScaleOrderByWithRelationInput =
      sortField === 'label'
        ? { label: sortDirection || this.sortOrder }
        : { rank: sortDirection || this.sortOrder }

    return this.prisma.performanceScale.findMany({ where, orderBy })
  }

  // Override base class method to use string ID (will convert internally)
  async byId(id: string): Promise<PerformanceScale | null> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) return null
    return this.byNumericId(numericId)
  }

  // Numeric ID version for internal use
  async byNumericId(id: number): Promise<PerformanceScale | null> {
    return this.prisma.performanceScale.findUnique({ where: { id } })
  }

  async create(data: CreatePerformanceScaleInput): Promise<PerformanceScale> {
    // Check for duplicate rank
    const rankExists = await this.existsByRank(data.rank)
    if (rankExists) throw ResourceError.performanceScale.rankAlreadyExists(data.rank)

    // Check for duplicate label
    const labelExists = await this.existsByLabel(data.label)
    if (labelExists) throw ResourceError.performanceScale.alreadyExists(data.label)

    return this.handleDatabaseOperation(
      () => this.prisma.performanceScale.create({ data }),
      'PerformanceScale',
    )
  }

  // Override base class method to use string ID (will convert internally)
  async update(id: string, data: Partial<UpdatePerformanceScaleInput>): Promise<PerformanceScale> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) throw new Error('Invalid numeric ID')
    return this.updateByNumericId(numericId, data)
  }

  // Numeric ID version for internal use
  async updateByNumericId(
    id: number,
    data: Partial<UpdatePerformanceScaleInput>,
  ): Promise<PerformanceScale> {
    // Check if scale exists
    const scale = await this.byNumericId(id)
    if (!scale) throw ResourceError.performanceScale.notFound()

    // Check for duplicate rank if being updated
    if (data.rank !== undefined) {
      const rankExists = await this.existsByRank(data.rank, id)
      if (rankExists) throw ResourceError.performanceScale.rankAlreadyExists(data.rank)
    }

    // Check for duplicate label if being updated
    if (data.label) {
      const labelExists = await this.existsByLabel(data.label, id)
      if (labelExists) throw ResourceError.performanceScale.alreadyExists(data.label)
    }

    return this.handleDatabaseOperation(
      () => this.prisma.performanceScale.update({ where: { id }, data }),
      'PerformanceScale',
    )
  }

  // Override base class method to use string ID (will convert internally)
  async delete(id: string): Promise<void> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) throw new Error('Invalid numeric ID')
    await this.deleteByNumericId(numericId)
  }

  // Numeric ID version for internal use
  async deleteByNumericId(id: number): Promise<void> {
    // Check if scale exists and has listings
    const scale = await this.prisma.performanceScale.findUnique({
      where: { id },
      include: { _count: { select: { listings: true, pcListings: true } } },
    })

    if (!scale) throw ResourceError.performanceScale.notFound()

    const totalListings = scale._count.listings + scale._count.pcListings
    if (totalListings > 0) {
      throw ResourceError.performanceScale.inUse(totalListings)
    }

    await this.handleDatabaseOperation(
      () => this.prisma.performanceScale.delete({ where: { id } }),
      'PerformanceScale',
    )
  }

  /**
   * Get total count with filters
   */
  async count(filters: GetPerformanceScalesInput = {}): Promise<number> {
    const { search } = filters

    const where: Prisma.PerformanceScaleWhereInput = {
      ...(search && {
        OR: [
          { label: { contains: search, mode: this.mode } },
          { description: { contains: search, mode: this.mode } },
        ],
      }),
    }

    return this.prisma.performanceScale.count({ where })
  }

  /**
   * Check if rank is already taken
   */
  async existsByRank(rank: number, excludeId?: number): Promise<boolean> {
    const scale = await this.prisma.performanceScale.findFirst({
      where: { rank, ...(excludeId && { id: { not: excludeId } }) },
    })
    return !!scale
  }

  /**
   * Check if label exists
   */
  async existsByLabel(label: string, excludeId?: number): Promise<boolean> {
    const scale = await this.prisma.performanceScale.findFirst({
      where: {
        label: { equals: label, mode: this.mode },
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !!scale
  }

  /**
   * Get performance scales with listing counts
   */
  async listWithCounts(): Promise<
    Prisma.PerformanceScaleGetPayload<{
      include: typeof PerformanceScalesRepository.includes.withCounts
    }>[]
  > {
    return this.prisma.performanceScale.findMany({
      include: PerformanceScalesRepository.includes.withCounts,
      orderBy: { rank: this.sortOrder },
    })
  }

  /**
   * Get the next available rank
   */
  async getNextRank(): Promise<number> {
    const highestRank = await this.prisma.performanceScale.findFirst({
      orderBy: { rank: Prisma.SortOrder.desc },
      select: { rank: true },
    })
    return (highestRank?.rank ?? 0) + 1
  }

  /**
   * Reorder performance scales
   */
  async reorder(scales: { id: number; rank: number }[]): Promise<void> {
    await this.prisma.$transaction(
      scales.map((scale) =>
        this.prisma.performanceScale.update({
          where: { id: scale.id },
          data: { rank: scale.rank },
        }),
      ),
    )
  }

  /**
   * Get performance scale by label
   */
  async byLabel(label: string): Promise<PerformanceScale | null> {
    return this.prisma.performanceScale.findFirst({
      where: { label: { equals: label, mode: this.mode } },
    })
  }

  /**
   * Get performance scale by rank
   */
  async byRank(rank: number): Promise<PerformanceScale | null> {
    return this.prisma.performanceScale.findFirst({
      where: { rank },
    })
  }

  /**
   * Get statistics about performance scales
   */
  async stats(): Promise<{
    total: number
    withListings: number
    withoutListings: number
  }> {
    const [withListings, withoutListings] = await Promise.all([
      this.prisma.performanceScale.count({
        where: {
          OR: [{ listings: { some: {} } }, { pcListings: { some: {} } }],
        },
      }),
      this.prisma.performanceScale.count({
        where: {
          AND: [{ listings: { none: {} } }, { pcListings: { none: {} } }],
        },
      }),
    ])

    return {
      total: withListings + withoutListings,
      withListings,
      withoutListings,
    }
  }
}
