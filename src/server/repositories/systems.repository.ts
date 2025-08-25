import { Prisma, type System } from '@orm'
import { BaseRepository } from './base.repository'
import type { GetSystemsInput, CreateSystemInput, UpdateSystemInput } from '@/schemas/system'

/**
 * Repository for System data access
 */
export class SystemsRepository extends BaseRepository {
  async get(filters: GetSystemsInput = {}): Promise<(System & { _count: { games: number } })[]> {
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
      include: { _count: { select: { games: true } } },
      orderBy,
    })
  }

  async byId(
    id: string,
  ): Promise<
    | (System & {
        games: { id: string; title: string; systemId: string }[]
        _count: { games: number }
      })
    | null
  > {
    return this.prisma.system.findUnique({
      where: { id },
      include: {
        games: { orderBy: { title: this.sortOrder } },
        _count: { select: { games: true } },
      },
    })
  }

  async byName(name: string): Promise<System | null> {
    return this.prisma.system.findUnique({ where: { name } })
  }

  async create(data: CreateSystemInput): Promise<System> {
    return this.prisma.system.create({ data })
  }

  async update(id: string, data: Partial<UpdateSystemInput>): Promise<System> {
    return this.prisma.system.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.system.delete({ where: { id } })
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
  async getByKey(key: string): Promise<System | null> {
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
  async getWithGameCounts(): Promise<(System & { _count: { games: number } })[]> {
    return this.prisma.system.findMany({
      include: { _count: { select: { games: true } } },
      orderBy: { games: { _count: Prisma.SortOrder.desc } },
    })
  }

  /**
   * Get systems with emulator compatibility
   */
  async getWithEmulators(): Promise<(System & { emulators: { id: string; name: string }[] })[]> {
    return this.prisma.system.findMany({
      include: { emulators: { select: { id: true, name: true } } },
      orderBy: { name: this.sortOrder },
    })
  }

  /**
   * Get statistics about systems
   */
  async getStats(): Promise<{
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
