import { AppError, ResourceError } from '@/lib/errors'
import { Prisma, type PerformanceScale } from '@orm/client'
import { BaseRepository } from './base.repository'
import type {
  GetPerformanceScalesInput,
  CreatePerformanceScaleInput,
  UpdatePerformanceScaleInput,
} from '@/schemas/performanceScale'

export class PerformanceScalesRepository extends BaseRepository {
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

    const orderBy: Prisma.PerformanceScaleOrderByWithRelationInput =
      sortField === 'label'
        ? { label: sortDirection || this.sortOrder }
        : { rank: sortDirection || this.sortOrder }

    return this.prisma.performanceScale.findMany({ where, orderBy })
  }

  async byId(id: string): Promise<PerformanceScale | null> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) return null
    return this.byNumericId(numericId)
  }

  async byNumericId(id: number): Promise<PerformanceScale | null> {
    return this.prisma.performanceScale.findUnique({ where: { id } })
  }

  async create(data: CreatePerformanceScaleInput): Promise<PerformanceScale> {
    const rankExists = await this.existsByRank(data.rank)
    if (rankExists) throw ResourceError.performanceScale.rankAlreadyExists(data.rank)

    const labelExists = await this.existsByLabel(data.label)
    if (labelExists) throw ResourceError.performanceScale.alreadyExists(data.label)

    return this.handleDatabaseOperation(
      () => this.prisma.performanceScale.create({ data }),
      'PerformanceScale',
    )
  }

  async update(id: string, data: Partial<UpdatePerformanceScaleInput>): Promise<PerformanceScale> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) throw new Error('Invalid numeric ID')
    return this.updateByNumericId(numericId, data)
  }

  async updateByNumericId(
    id: number,
    data: Partial<UpdatePerformanceScaleInput>,
  ): Promise<PerformanceScale> {
    const scale = await this.byNumericId(id)
    if (!scale) throw ResourceError.performanceScale.notFound()

    if (data.rank !== undefined) {
      const rankExists = await this.existsByRank(data.rank, id)
      if (rankExists) throw ResourceError.performanceScale.rankAlreadyExists(data.rank)
    }

    if (data.label) {
      const labelExists = await this.existsByLabel(data.label, id)
      if (labelExists) throw ResourceError.performanceScale.alreadyExists(data.label)
    }

    return this.handleDatabaseOperation(
      () => this.prisma.performanceScale.update({ where: { id }, data }),
      'PerformanceScale',
    )
  }

  async delete(id: string): Promise<void> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) throw new Error('Invalid numeric ID')
    await this.deleteByNumericId(numericId)
  }

  async deleteByNumericId(id: number): Promise<void> {
    await this.deleteByNumericIdWithReplacement(id)
  }

  async deleteByNumericIdWithReplacement(id: number, replacementId?: number): Promise<void> {
    const scale = await this.prisma.performanceScale.findUnique({
      where: { id },
      include: { _count: { select: { listings: true, pcListings: true } } },
    })

    if (!scale) throw ResourceError.performanceScale.notFound()

    if (replacementId === id) {
      throw AppError.badRequest(
        'Replacement performance scale must be different from the deleted scale',
      )
    }

    if (replacementId !== undefined) {
      const replacementScale = await this.prisma.performanceScale.findUnique({
        where: { id: replacementId },
        select: { id: true },
      })

      if (!replacementScale) throw ResourceError.performanceScale.notFound()
    }

    const totalListings = scale._count.listings + scale._count.pcListings
    if (totalListings > 0 && replacementId === undefined) {
      throw ResourceError.performanceScale.inUse(totalListings)
    }

    await this.handleDatabaseOperation(
      () =>
        this.prisma.$transaction(async (tx) => {
          if (replacementId !== undefined) {
            await tx.listing.updateMany({
              where: { performanceId: id },
              data: { performanceId: replacementId },
            })
            await tx.pcListing.updateMany({
              where: { performanceId: id },
              data: { performanceId: replacementId },
            })
          }

          await tx.performanceScale.delete({ where: { id } })
        }),
      'PerformanceScale',
    )
  }

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

  async existsByRank(rank: number, excludeId?: number): Promise<boolean> {
    const scale = await this.prisma.performanceScale.findFirst({
      where: { rank, ...(excludeId && { id: { not: excludeId } }) },
    })
    return !!scale
  }

  async existsByLabel(label: string, excludeId?: number): Promise<boolean> {
    const scale = await this.prisma.performanceScale.findFirst({
      where: {
        label: { equals: label, mode: this.mode },
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !!scale
  }

  async listWithCounts(filters: GetPerformanceScalesInput = {}): Promise<
    Prisma.PerformanceScaleGetPayload<{
      include: typeof PerformanceScalesRepository.includes.withCounts
    }>[]
  > {
    const { search, sortField = 'rank', sortDirection } = filters

    const where: Prisma.PerformanceScaleWhereInput = {
      ...(search && {
        OR: [
          { label: { contains: search, mode: this.mode } },
          { description: { contains: search, mode: this.mode } },
        ],
      }),
    }

    const orderBy: Prisma.PerformanceScaleOrderByWithRelationInput =
      sortField === 'label'
        ? { label: sortDirection || this.sortOrder }
        : { rank: sortDirection || this.sortOrder }

    return this.prisma.performanceScale.findMany({
      where,
      include: PerformanceScalesRepository.includes.withCounts,
      orderBy,
    })
  }

  async getNextRank(): Promise<number> {
    const highestRank = await this.prisma.performanceScale.findFirst({
      orderBy: { rank: Prisma.SortOrder.desc },
      select: { rank: true },
    })
    return (highestRank?.rank ?? 0) + 1
  }

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

  async byLabel(label: string): Promise<PerformanceScale | null> {
    return this.prisma.performanceScale.findFirst({
      where: { label: { equals: label, mode: this.mode } },
    })
  }

  async byRank(rank: number): Promise<PerformanceScale | null> {
    return this.prisma.performanceScale.findFirst({
      where: { rank },
    })
  }

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
