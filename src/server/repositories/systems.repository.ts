import { ResourceError } from '@/lib/errors'
import { Prisma, type System } from '@orm'
import { BaseRepository } from './base.repository'
import type { GetSystemsInput, CreateSystemInput, UpdateSystemInput } from '@/schemas/system'

/**
 * Repository for System data access
 */
export class SystemsRepository extends BaseRepository {
  // Static query shapes for this repository
  static readonly includes = {
    default: {} satisfies Prisma.SystemInclude,

    withCounts: {
      _count: { select: { games: true } },
    } satisfies Prisma.SystemInclude,

    withGames: {
      games: { orderBy: { title: 'asc' as const } },
      _count: { select: { games: true } },
    } satisfies Prisma.SystemInclude,

    withEmulators: {
      emulators: { select: { id: true, name: true } },
    } satisfies Prisma.SystemInclude,
  } as const

  async list(
    filters: GetSystemsInput = {},
  ): Promise<Prisma.SystemGetPayload<{ include: typeof SystemsRepository.includes.withCounts }>[]> {
    const sortDirection = filters.sortDirection ?? this.sortOrder
    const sortField = filters.sortField ?? 'name'

    const where: Prisma.SystemWhereInput = {
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: this.mode } },
          { key: { contains: filters.search, mode: this.mode } },
        ],
      }),
    }

    // Map schema sort fields to Prisma orderBy
    const orderBy: Prisma.SystemOrderByWithRelationInput =
      sortField === 'gamesCount'
        ? { games: { _count: sortDirection } }
        : sortField === 'key'
          ? { key: sortDirection }
          : { name: sortDirection }

    return this.prisma.system.findMany({
      where,
      include: SystemsRepository.includes.withCounts,
      orderBy,
    })
  }

  async byId(id: string): Promise<Prisma.SystemGetPayload<{
    include: typeof SystemsRepository.includes.withGames
  }> | null> {
    return this.prisma.system.findUnique({
      where: { id },
      include: SystemsRepository.includes.withGames,
    })
  }

  async byName(name: string): Promise<System | null> {
    return this.prisma.system.findUnique({ where: { name } })
  }

  async create(data: CreateSystemInput): Promise<System> {
    // Check for duplicate name
    const exists = await this.existsByName(data.name)
    if (exists) throw ResourceError.system.alreadyExists(data.name)

    return this.handleDatabaseOperation(() => this.prisma.system.create({ data }), 'System')
  }

  async update(id: string, data: Partial<UpdateSystemInput>): Promise<System> {
    // Check if system exists
    const system = await this.byId(id)
    if (!system) throw ResourceError.system.notFound()

    // Check for duplicate name if being updated
    if (data.name) {
      const exists = await this.existsByName(data.name, id)
      if (exists) throw ResourceError.system.alreadyExists(data.name)
    }

    return this.handleDatabaseOperation(
      () => this.prisma.system.update({ where: { id }, data }),
      'System',
    )
  }

  async delete(id: string): Promise<void> {
    // Check if system exists and has games
    const system = await this.byId(id)
    if (!system) throw ResourceError.system.notFound()

    if (system._count.games > 0) {
      throw ResourceError.system.inUse(system._count.games)
    }

    await this.handleDatabaseOperation(() => this.prisma.system.delete({ where: { id } }), 'System')
  }

  /**
   * Get total count with filters
   */
  async count(filters: GetSystemsInput = {}): Promise<number> {
    const { search } = filters

    const where: Prisma.SystemWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: this.mode } },
          { key: { contains: search, mode: this.mode } },
        ],
      }),
    }

    return this.prisma.system.count({ where })
  }

  /**
   * Get system by key
   */
  async byKey(key: string): Promise<System | null> {
    return this.prisma.system.findFirst({ where: { key } })
  }

  /**
   * Check if system name exists
   */
  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const system = await this.prisma.system.findFirst({
      where: {
        name: { equals: name, mode: this.mode },
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !!system
  }

  /**
   * Get systems with game counts
   */
  async listWithCounts(): Promise<
    Prisma.SystemGetPayload<{ include: typeof SystemsRepository.includes.withCounts }>[]
  > {
    return this.prisma.system.findMany({
      include: SystemsRepository.includes.withCounts,
      orderBy: { games: { _count: Prisma.SortOrder.desc } },
    })
  }

  /**
   * Get systems with emulator compatibility
   */
  async listWithEmulators(): Promise<
    Prisma.SystemGetPayload<{ include: typeof SystemsRepository.includes.withEmulators }>[]
  > {
    return this.prisma.system.findMany({
      include: SystemsRepository.includes.withEmulators,
      orderBy: { name: this.sortOrder },
    })
  }

  /**
   * Get statistics about systems
   */
  async stats(): Promise<{
    total: number
    withGames: number
    withoutGames: number
  }> {
    const [withGames, withoutGames] = await Promise.all([
      this.prisma.system.count({ where: { games: { some: {} } } }),
      this.prisma.system.count({ where: { games: { none: {} } } }),
    ])

    return {
      total: withGames + withoutGames,
      withGames,
      withoutGames,
    }
  }
}
