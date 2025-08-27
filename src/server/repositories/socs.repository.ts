import { PAGINATION } from '@/data/constants'
import { ResourceError } from '@/lib/errors'
import { Prisma, type SoC } from '@orm'
import { BaseRepository } from './base.repository'
import type { GetSoCsInput, CreateSoCInput, UpdateSoCInput } from '@/schemas/soc'

/**
 * Repository for SoC (System on Chip) data access
 */
export class SoCsRepository extends BaseRepository {
  // Static query shapes for this repository
  static readonly includes = {
    default: {} satisfies Prisma.SoCInclude,

    withCounts: {
      _count: { select: { devices: true } },
    } satisfies Prisma.SoCInclude,

    withDevices: {
      devices: {
        select: { id: true, modelName: true, brand: { select: { name: true } } },
      },
    } satisfies Prisma.SoCInclude,
  } as const

  async list(
    filters: GetSoCsInput = {},
  ): Promise<Prisma.SoCGetPayload<{ include: typeof SoCsRepository.includes.withCounts }>[]> {
    const sortDirection = filters.sortDirection ?? this.sortOrder
    const sortField = filters.sortField ?? 'name'
    const { limit = PAGINATION.DEFAULT_LIMIT, offset = 0 } = filters

    const where: Prisma.SoCWhereInput = {
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: this.mode } },
          { manufacturer: { contains: filters.search, mode: this.mode } },
          { architecture: { contains: filters.search, mode: this.mode } },
          { gpuModel: { contains: filters.search, mode: this.mode } },
        ],
      }),
    }

    // Map schema sort fields to Prisma orderBy
    const orderBy: Prisma.SoCOrderByWithRelationInput =
      sortField === 'manufacturer'
        ? { manufacturer: sortDirection }
        : sortField === 'devicesCount'
          ? { devices: { _count: sortDirection } }
          : { name: sortDirection }

    return this.prisma.soC.findMany({
      where,
      include: SoCsRepository.includes.withCounts,
      orderBy,
      take: limit,
      skip: offset,
    })
  }

  async byId(id: string): Promise<SoC | null> {
    return this.prisma.soC.findUnique({ where: { id } })
  }

  async create(data: CreateSoCInput): Promise<SoC> {
    // Check for duplicate name
    const exists = await this.existsByName(data.name)
    if (exists) throw ResourceError.soc.alreadyExists(data.name)

    return this.handleDatabaseOperation(
      () =>
        this.prisma.soC.create({
          data: {
            ...data,
            architecture: data.architecture ?? null,
            processNode: data.processNode ?? null,
            cpuCores: data.cpuCores ?? null,
            gpuModel: data.gpuModel ?? null,
          },
        }),
      'SoC',
    )
  }

  async update(id: string, data: Partial<UpdateSoCInput>): Promise<SoC> {
    // Check if SoC exists
    const soc = await this.byId(id)
    if (!soc) throw ResourceError.soc.notFound()

    // Check for duplicate name if being updated
    if (data.name) {
      const exists = await this.existsByName(data.name, id)
      if (exists) throw ResourceError.soc.alreadyExists(data.name)
    }

    return this.handleDatabaseOperation(
      () =>
        this.prisma.soC.update({
          where: { id },
          data: {
            ...data,
            architecture: data.architecture ?? undefined,
            processNode: data.processNode ?? undefined,
            cpuCores: data.cpuCores ?? undefined,
            gpuModel: data.gpuModel ?? undefined,
          },
        }),
      'SoC',
    )
  }

  async delete(id: string): Promise<void> {
    // Check if SoC exists and has devices
    const soc = await this.prisma.soC.findUnique({
      where: { id },
      include: { _count: { select: { devices: true } } },
    })

    if (!soc) throw ResourceError.soc.notFound()
    if (soc._count.devices > 0) {
      throw ResourceError.soc.inUse(soc._count.devices)
    }

    await this.handleDatabaseOperation(() => this.prisma.soC.delete({ where: { id } }), 'SoC')
  }

  /**
   * Get total count with filters
   */
  async count(filters: GetSoCsInput = {}): Promise<number> {
    const { search } = filters

    const where: Prisma.SoCWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: this.mode } },
          { manufacturer: { contains: search, mode: this.mode } },
          { architecture: { contains: search, mode: this.mode } },
          { gpuModel: { contains: search, mode: this.mode } },
        ],
      }),
    }

    return this.prisma.soC.count({ where })
  }

  /**
   * Check if SoC name exists
   */
  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const soc = await this.prisma.soC.findFirst({
      where: {
        name: { equals: name, mode: this.mode },
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !!soc
  }

  /**
   * Get SoCs with device counts
   */
  async listWithCounts(): Promise<
    Prisma.SoCGetPayload<{ include: typeof SoCsRepository.includes.withCounts }>[]
  > {
    return this.prisma.soC.findMany({
      include: SoCsRepository.includes.withCounts,
      orderBy: { devices: { _count: Prisma.SortOrder.desc } },
    })
  }

  /**
   * Get SoCs by manufacturer
   */
  async listByManufacturer(manufacturer: string): Promise<SoC[]> {
    return this.prisma.soC.findMany({
      where: { manufacturer: { equals: manufacturer, mode: this.mode } },
      orderBy: { name: this.sortOrder },
    })
  }

  /**
   * Get SoCs with their devices
   */
  async byIdWithDevices(
    socId: string,
  ): Promise<Prisma.SoCGetPayload<{ include: typeof SoCsRepository.includes.withDevices }> | null> {
    return this.prisma.soC.findUnique({
      where: { id: socId },
      include: SoCsRepository.includes.withDevices,
    })
  }

  /**
   * Get unique manufacturers
   */
  async listManufacturers(): Promise<string[]> {
    const manufacturers = await this.prisma.soC.findMany({
      select: { manufacturer: true },
      distinct: ['manufacturer'],
      orderBy: { manufacturer: this.sortOrder },
    })
    return manufacturers.map((m: { manufacturer: string }) => m.manufacturer)
  }

  /**
   * Get all SoCs for mobile (simple list sorted by manufacturer and name)
   */
  async listForMobile(): Promise<{ id: string; name: string; manufacturer: string }[]> {
    return this.prisma.soC.findMany({
      select: { id: true, name: true, manufacturer: true },
      orderBy: [{ manufacturer: this.sortOrder }, { name: this.sortOrder }],
    })
  }
}
