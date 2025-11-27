import { PAGINATION } from '@/data/constants'
import { ResourceError } from '@/lib/errors'
import { type PaginationResult, paginate, calculateOffset } from '@/server/utils/pagination'
import { ApprovalStatus, Prisma } from '@orm'
import { BaseRepository } from './base.repository'

export interface EmulatorFilters {
  search?: string | null
  limit?: number | null
  offset?: number | null
  page?: number | null
  sortField?: string | null
  sortDirection?: Prisma.SortOrder | null
  systemId?: string | null
}

type DetailedEmulatorListItem = Prisma.EmulatorGetPayload<{
  include: typeof EmulatorsRepository.includes.withDevelopersAndCounts
}>

type MinimalEmulatorListItem = Prisma.EmulatorGetPayload<{
  include: typeof EmulatorsRepository.includes.minimal
}>

type EmulatorListResponse<TEmulator> = Promise<{
  emulators: TEmulator[]
  pagination: PaginationResult
}>

type DetailedEmulatorDetail = Prisma.EmulatorGetPayload<{
  include: typeof EmulatorsRepository.includes.detail
}>

type MinimalEmulatorDetail = Prisma.EmulatorGetPayload<{
  include: typeof EmulatorsRepository.includes.minimal
}>

/**
 * Repository for Emulator data access
 */
export class EmulatorsRepository extends BaseRepository {
  private static readonly SYSTEM_SELECTION = {
    select: { id: true, name: true, key: true },
  } as const

  static readonly includes = {
    default: {
      systems: EmulatorsRepository.SYSTEM_SELECTION,
    } satisfies Prisma.EmulatorInclude,

    withCustomFields: {
      systems: EmulatorsRepository.SYSTEM_SELECTION,
      customFieldDefinitions: {
        orderBy: { displayOrder: 'asc' as const },
      },
    } satisfies Prisma.EmulatorInclude,

    withDevelopers: {
      systems: EmulatorsRepository.SYSTEM_SELECTION,
      verifiedDevelopers: {
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
        },
      },
    } satisfies Prisma.EmulatorInclude,

    withDevelopersAndCounts: {
      systems: EmulatorsRepository.SYSTEM_SELECTION,
      verifiedDevelopers: {
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
        },
      },
      _count: { select: { listings: true, systems: true } },
    } satisfies Prisma.EmulatorInclude,

    minimal: {
      systems: EmulatorsRepository.SYSTEM_SELECTION,
      _count: {
        select: {
          listings: { where: { status: ApprovalStatus.APPROVED } },
        },
      },
    } satisfies Prisma.EmulatorInclude,

    forDeletion: {
      _count: { select: { listings: true, pcListings: true } },
    } satisfies Prisma.EmulatorInclude,

    detail: {
      systems: EmulatorsRepository.SYSTEM_SELECTION,
      verifiedDevelopers: {
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
        },
      },
      customFieldDefinitions: {
        orderBy: { displayOrder: 'asc' as const },
      },
      _count: {
        select: {
          listings: true,
          systems: true,
          customFieldDefinitions: true,
        },
      },
    } satisfies Prisma.EmulatorInclude,
  } as const

  static readonly selects = {
    trending: {
      id: true,
      name: true,
      logo: true,
      description: true,
      systems: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          listings: { where: { status: ApprovalStatus.APPROVED } },
        },
      },
    } satisfies Prisma.EmulatorSelect,
  } as const

  list(filters?: EmulatorFilters): EmulatorListResponse<DetailedEmulatorListItem>
  list(
    filters: EmulatorFilters | undefined,
    options: { minimal: true },
  ): EmulatorListResponse<MinimalEmulatorListItem>
  async list(
    filters: EmulatorFilters = {},
    options?: { minimal?: boolean },
  ): Promise<{
    emulators: DetailedEmulatorListItem[] | MinimalEmulatorListItem[]
    pagination: PaginationResult
  }> {
    const {
      search,
      systemId,
      limit = PAGINATION.DEFAULT_LIMIT,
      offset = 0,
      page,
      sortField,
      sortDirection,
    } = filters

    const where = this.buildWhereClause(search, systemId)
    const orderBy = this.buildOrderBy(sortField, sortDirection)
    const resolvedLimit = limit ?? PAGINATION.DEFAULT_LIMIT
    const actualOffset = calculateOffset({ page, offset }, resolvedLimit)

    const include = options?.minimal
      ? EmulatorsRepository.includes.minimal
      : EmulatorsRepository.includes.withDevelopersAndCounts

    const [total, emulators] = await Promise.all([
      this.prisma.emulator.count({ where }),
      this.prisma.emulator.findMany({
        where,
        include,
        orderBy,
        take: resolvedLimit,
        skip: actualOffset,
      }),
    ])

    const pagination = paginate({
      total,
      page: page ?? Math.floor(actualOffset / resolvedLimit) + 1,
      limit: resolvedLimit,
    })

    if (options?.minimal) {
      return {
        emulators: emulators as MinimalEmulatorListItem[],
        pagination,
      }
    }

    return {
      emulators: emulators as DetailedEmulatorListItem[],
      pagination,
    }
  }

  byId(id: string): Promise<DetailedEmulatorDetail | null>
  byId(id: string, options: { minimal: true }): Promise<MinimalEmulatorDetail | null>
  async byId(id: string, options?: { minimal?: boolean }) {
    if (options?.minimal) {
      return this.prisma.emulator.findUnique({
        where: { id },
        include: EmulatorsRepository.includes.minimal,
      })
    }

    return this.prisma.emulator.findUnique({
      where: { id },
      include: EmulatorsRepository.includes.detail,
    })
  }

  async create(data: Prisma.EmulatorCreateInput): Promise<
    Prisma.EmulatorGetPayload<{
      include: typeof EmulatorsRepository.includes.default
    }>
  > {
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
    const emulator = await this.byId(id)
    if (!emulator) throw ResourceError.emulator.notFound()

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

  private buildWhereClause(
    search?: string | null,
    systemId?: string | null,
  ): Prisma.EmulatorWhereInput {
    const clauses: Prisma.EmulatorWhereInput[] = []

    if (search) {
      clauses.push({
        OR: [
          { name: { contains: search, mode: this.mode } },
          { description: { contains: search, mode: this.mode } },
        ],
      })
    }

    if (systemId) clauses.push({ systems: { some: { id: systemId } } })

    if (clauses.length === 0) return {}
    if (clauses.length === 1) return clauses[0]

    return { AND: clauses }
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

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const emulator = await this.prisma.emulator.findFirst({
      where: {
        name: { equals: name, mode: this.mode },
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !!emulator
  }

  async updateSupportedSystems(
    emulatorId: string,
    systemIds: string[],
  ): Promise<
    Prisma.EmulatorGetPayload<{
      include: typeof EmulatorsRepository.includes.default
    }>
  > {
    await this.prisma.emulator.update({
      where: { id: emulatorId },
      data: { systems: { set: [] } },
    })

    return this.prisma.emulator.update({
      where: { id: emulatorId },
      data: { systems: { connect: systemIds.map((id) => ({ id })) } },
      include: EmulatorsRepository.includes.default,
    })
  }

  /**
   * Get trending emulators based on approved listing count
   */
  async getTrending(limit: number = 8) {
    const emulators = await this.prisma.emulator.findMany({
      select: EmulatorsRepository.selects.trending,
      where: { listings: { some: { status: ApprovalStatus.APPROVED } } },
      orderBy: { listings: { _count: Prisma.SortOrder.desc } },
      take: limit,
    })

    return emulators.map((emulator) => ({
      id: emulator.id,
      name: emulator.name,
      logo: emulator.logo,
      description: emulator.description,
      systems: emulator.systems.map((s) => s.name),
      listingCount: emulator._count.listings,
    }))
  }
}
