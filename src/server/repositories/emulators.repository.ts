import { PAGINATION } from '@/data/constants'
import { ResourceError } from '@/lib/errors'
import { type PaginationResult, paginate, calculateOffset } from '@/server/utils/pagination'
import { type Prisma } from '@orm'
import { BaseRepository } from './base.repository'

export interface EmulatorFilters {
  search?: string | null
  limit?: number | null
  offset?: number | null
  page?: number | null
  sortField?: string | null
  sortDirection?: Prisma.SortOrder | null
}

/**
 * Repository for Emulator data access
 */
export class EmulatorsRepository extends BaseRepository {
  // Static query shapes for this repository
  static readonly includes = {
    default: {
      systems: { select: { id: true, name: true, key: true } },
    } satisfies Prisma.EmulatorInclude,

    withCustomFields: {
      systems: { select: { id: true, name: true, key: true } },
      customFieldDefinitions: {
        orderBy: { displayOrder: 'asc' as const },
      },
    } satisfies Prisma.EmulatorInclude,

    withDevelopers: {
      systems: { select: { id: true, name: true, key: true } },
      verifiedDevelopers: {
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
        },
      },
    } satisfies Prisma.EmulatorInclude,

    forDeletion: {
      _count: { select: { listings: true, pcListings: true } },
    } satisfies Prisma.EmulatorInclude,
  } as const

  async list(filters: EmulatorFilters = {}): Promise<{
    emulators: Prisma.EmulatorGetPayload<{
      include: typeof EmulatorsRepository.includes.withDevelopers & {
        _count: { select: { listings: true; systems: true } }
      }
    }>[]
    pagination: PaginationResult
  }> {
    const {
      search,
      limit = PAGINATION.DEFAULT_LIMIT,
      offset = 0,
      page,
      sortField,
      sortDirection,
    } = filters

    const where = this.buildWhereClause(search)
    const orderBy = this.buildOrderBy(sortField, sortDirection)
    const actualOffset = calculateOffset({ page, offset }, limit ?? 20)

    const [total, emulators] = await Promise.all([
      this.prisma.emulator.count({ where }),
      this.prisma.emulator.findMany({
        where,
        include: {
          ...EmulatorsRepository.includes.withDevelopers,
          _count: { select: { listings: true, systems: true } },
        },
        orderBy,
        take: limit ?? 20,
        skip: actualOffset,
      }),
    ])

    const pagination = paginate({
      total: total,
      page: page ?? Math.floor(actualOffset / (limit ?? 20)) + 1,
      limit: limit ?? 20,
    })

    return { emulators, pagination }
  }

  async byId(id: string): Promise<Prisma.EmulatorGetPayload<{
    include: typeof EmulatorsRepository.includes.withDevelopers &
      typeof EmulatorsRepository.includes.withCustomFields & {
        _count: { select: { listings: true; systems: true; customFieldDefinitions: true } }
      }
  }> | null> {
    return this.prisma.emulator.findUnique({
      where: { id },
      include: {
        ...EmulatorsRepository.includes.withDevelopers,
        ...EmulatorsRepository.includes.withCustomFields,
        _count: {
          select: {
            listings: true,
            systems: true,
            customFieldDefinitions: true,
          },
        },
      },
    })
  }

  async create(data: Prisma.EmulatorCreateInput): Promise<
    Prisma.EmulatorGetPayload<{
      include: typeof EmulatorsRepository.includes.default
    }>
  > {
    // Check for duplicate name
    const exists = await this.existsByName(data.name as string)
    if (exists) throw ResourceError.emulator.alreadyExists(data.name as string)

    return this.handleDatabaseOperation(
      () =>
        this.prisma.emulator.create({
          data,
          include: EmulatorsRepository.includes.default,
        }),
      'Emulator',
    )
  }

  async update(
    id: string,
    data: Prisma.EmulatorUpdateInput,
  ): Promise<
    Prisma.EmulatorGetPayload<{
      include: typeof EmulatorsRepository.includes.default
    }>
  > {
    // Check if emulator exists
    const emulator = await this.byId(id)
    if (!emulator) throw ResourceError.emulator.notFound()

    // Check for duplicate name if being updated
    if (data.name && typeof data.name === 'string') {
      const exists = await this.existsByName(data.name, id)
      if (exists) throw ResourceError.emulator.alreadyExists(data.name)
    }

    return this.handleDatabaseOperation(
      () =>
        this.prisma.emulator.update({
          where: { id },
          data,
          include: EmulatorsRepository.includes.default,
        }),
      'Emulator',
    )
  }

  async delete(id: string): Promise<void> {
    // Check if emulator exists and has listings
    const emulator = await this.prisma.emulator.findUnique({
      where: { id },
      include: EmulatorsRepository.includes.forDeletion,
    })

    if (!emulator) throw ResourceError.emulator.notFound()

    const totalListings = emulator._count.listings + emulator._count.pcListings
    if (totalListings > 0) {
      throw ResourceError.emulator.inUse(totalListings)
    }

    await this.handleDatabaseOperation(
      () => this.prisma.emulator.delete({ where: { id } }),
      'Emulator',
    )
  }

  async stats(): Promise<{
    total: number
    withListings: number
    withSystems: number
    withoutListings: number
  }> {
    const [total, withListings, withSystems] = await Promise.all([
      this.prisma.emulator.count(),
      this.prisma.emulator.count({ where: { listings: { some: {} } } }),
      this.prisma.emulator.count({ where: { systems: { some: {} } } }),
    ])

    return {
      total,
      withListings,
      withSystems,
      withoutListings: total - withListings,
    }
  }

  private buildWhereClause(search?: string | null): Prisma.EmulatorWhereInput {
    if (!search) return {}

    return {
      OR: [
        { name: { contains: search, mode: this.mode } },
        { description: { contains: search, mode: this.mode } },
      ],
    }
  }

  private buildOrderBy(
    sortField?: string | null,
    sortDirection?: Prisma.SortOrder | null,
  ): Prisma.EmulatorOrderByWithRelationInput {
    const direction = sortDirection || this.sortOrder

    switch (sortField) {
      case 'name':
        return { name: direction }
      case 'systemCount':
        return { systems: { _count: direction } }
      case 'listingCount':
        return { listings: { _count: direction } }
      default:
        return { name: this.sortOrder }
    }
  }

  /**
   * Check if emulator name exists
   */
  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const emulator = await this.prisma.emulator.findFirst({
      where: {
        name: { equals: name, mode: this.mode },
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !!emulator
  }

  /**
   * Update supported systems for an emulator
   */
  async updateSupportedSystems(
    emulatorId: string,
    systemIds: string[],
  ): Promise<
    Prisma.EmulatorGetPayload<{
      include: typeof EmulatorsRepository.includes.default
    }>
  > {
    // First disconnect all existing systems
    await this.prisma.emulator.update({
      where: { id: emulatorId },
      data: {
        systems: {
          set: [], // Clear all connections
        },
      },
    })

    // Then connect the new systems
    return this.prisma.emulator.update({
      where: { id: emulatorId },
      data: {
        systems: {
          connect: systemIds.map((id) => ({ id })),
        },
      },
      include: EmulatorsRepository.includes.default,
    })
  }
}
