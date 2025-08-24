import {
  calculateOffset,
  createPaginationResult,
  type PaginationResult,
} from '@/server/utils/pagination'
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
  } as const

  async getPaginated(filters: EmulatorFilters = {}): Promise<{
    emulators: Prisma.EmulatorGetPayload<{
      include: {
        systems: { select: { id: true; name: true; key: true } }
        verifiedDevelopers: {
          include: {
            user: { select: { id: true; name: true; profileImage: true } }
          }
        }
        _count: { select: { listings: true; systems: true } }
      }
    }>[]
    pagination: PaginationResult
  }> {
    const { search, limit = 20, offset = 0, page, sortField, sortDirection } = filters

    const where = this.buildWhereClause(search)
    const orderBy = this.buildOrderBy(sortField, sortDirection)
    const actualOffset = calculateOffset(
      { page: page ?? undefined, offset: offset ?? undefined },
      limit ?? 20,
    )

    const [total, emulators] = await Promise.all([
      this.prisma.emulator.count({ where }),
      this.prisma.emulator.findMany({
        where,
        include: {
          systems: { select: { id: true, name: true, key: true } },
          verifiedDevelopers: {
            include: {
              user: { select: { id: true, name: true, profileImage: true } },
            },
          },
          _count: { select: { listings: true, systems: true } },
        },
        orderBy,
        take: limit ?? 20,
        skip: actualOffset,
      }),
    ])

    const pagination = createPaginationResult(
      total,
      { page: page ?? undefined, offset: offset ?? undefined },
      limit ?? 20,
      actualOffset,
    )

    return { emulators, pagination }
  }

  async getById(id: string): Promise<Prisma.EmulatorGetPayload<{
    include: {
      systems: { select: { id: true; name: true; key: true } }
      verifiedDevelopers: {
        include: {
          user: { select: { id: true; name: true; profileImage: true } }
        }
      }
      customFieldDefinitions: {
        orderBy: { displayOrder: 'asc' }
      }
      _count: { select: { listings: true; systems: true; customFieldDefinitions: true } }
    }
  }> | null> {
    return this.prisma.emulator.findUnique({
      where: { id },
      include: {
        systems: { select: { id: true, name: true, key: true } },
        verifiedDevelopers: {
          include: {
            user: { select: { id: true, name: true, profileImage: true } },
          },
        },
        customFieldDefinitions: {
          orderBy: { displayOrder: 'asc' },
        },
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
      include: { systems: { select: { id: true; name: true; key: true } } }
    }>
  > {
    return this.prisma.emulator.create({
      data,
      include: {
        systems: { select: { id: true, name: true, key: true } },
      },
    })
  }

  async update(
    id: string,
    data: Prisma.EmulatorUpdateInput,
  ): Promise<
    Prisma.EmulatorGetPayload<{
      include: { systems: { select: { id: true; name: true; key: true } } }
    }>
  > {
    return this.prisma.emulator.update({
      where: { id },
      data,
      include: {
        systems: { select: { id: true, name: true, key: true } },
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.emulator.delete({ where: { id } })
  }

  async getStats(): Promise<{
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
      include: { systems: { select: { id: true; name: true; key: true } } }
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
      include: {
        systems: { select: { id: true, name: true, key: true } },
      },
    })
  }
}
