import { ResourceError } from '@/lib/errors'
import { Prisma, type DeviceBrand } from '@orm'
import { BaseRepository } from './base.repository'
import type {
  GetDeviceBrandsInput,
  CreateDeviceBrandInput,
  UpdateDeviceBrandInput,
} from '@/schemas/deviceBrand'

/**
 * Repository for DeviceBrand data access
 */
export class DeviceBrandsRepository extends BaseRepository {
  static readonly includes = {
    default: {} satisfies Prisma.DeviceBrandInclude,

    withCounts: {
      _count: {
        select: { devices: true },
      },
    } satisfies Prisma.DeviceBrandInclude,
  } as const
  async list(
    filters: GetDeviceBrandsInput = {},
  ): Promise<
    Prisma.DeviceBrandGetPayload<{ include: typeof DeviceBrandsRepository.includes.withCounts }>[]
  > {
    const { search, limit = 50, sortField = 'name', sortDirection } = filters

    const where: Prisma.DeviceBrandWhereInput = {
      ...(search && {
        name: { contains: search, mode: this.mode },
      }),
    }

    // Map schema sort fields to Prisma orderBy
    const orderBy: Prisma.DeviceBrandOrderByWithRelationInput =
      sortField === 'devicesCount'
        ? { devices: { _count: sortDirection || this.sortOrder } }
        : { name: sortDirection || this.sortOrder }

    return this.prisma.deviceBrand.findMany({
      where,
      include: DeviceBrandsRepository.includes.withCounts,
      orderBy,
      take: limit,
    })
  }

  async byId(id: string): Promise<DeviceBrand | null> {
    return this.prisma.deviceBrand.findUnique({ where: { id } })
  }

  async create(data: CreateDeviceBrandInput): Promise<DeviceBrand> {
    // Check for duplicate
    const exists = await this.existsByName(data.name)
    if (exists) throw ResourceError.deviceBrand.alreadyExists(data.name)

    return this.handleDatabaseOperation(
      () => this.prisma.deviceBrand.create({ data }),
      'DeviceBrand',
    )
  }

  async update(id: string, data: Partial<UpdateDeviceBrandInput>): Promise<DeviceBrand> {
    // Check if brand exists
    const brand = await this.byId(id)
    if (!brand) throw ResourceError.deviceBrand.notFound()

    // Check for duplicate name if being updated
    if (data.name) {
      const exists = await this.existsByName(data.name, id)
      if (exists) throw ResourceError.deviceBrand.alreadyExists(data.name)
    }

    return this.handleDatabaseOperation(
      () => this.prisma.deviceBrand.update({ where: { id }, data }),
      'DeviceBrand',
    )
  }

  async delete(id: string): Promise<void> {
    // Check if brand exists and has devices
    const brand = await this.prisma.deviceBrand.findUnique({
      where: { id },
      include: { _count: { select: { devices: true } } },
    })

    if (!brand) throw ResourceError.deviceBrand.notFound()
    if (brand._count.devices > 0) {
      throw ResourceError.deviceBrand.inUse(brand._count.devices)
    }

    await this.handleDatabaseOperation(
      () => this.prisma.deviceBrand.delete({ where: { id } }),
      'DeviceBrand',
    )
  }

  /**
   * Get total count with filters
   */
  async count(filters: GetDeviceBrandsInput = {}): Promise<number> {
    const { search } = filters

    const where: Prisma.DeviceBrandWhereInput = {
      ...(search && {
        name: { contains: search, mode: this.mode },
      }),
    }

    return this.prisma.deviceBrand.count({ where })
  }

  /**
   * Check if brand name exists
   */
  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const brand = await this.prisma.deviceBrand.findFirst({
      where: {
        name: { equals: name, mode: this.mode },
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !!brand
  }

  /**
   * Get brands with device counts
   */
  async listWithCounts(): Promise<
    Prisma.DeviceBrandGetPayload<{ include: typeof DeviceBrandsRepository.includes.withCounts }>[]
  > {
    return this.prisma.deviceBrand.findMany({
      include: DeviceBrandsRepository.includes.withCounts,
      orderBy: { devices: { _count: Prisma.SortOrder.desc } },
    })
  }

  /**
   * Get all brands for mobile (simple list sorted alphabetically)
   */
  async listForMobile(): Promise<{ id: string; name: string }[]> {
    return this.prisma.deviceBrand.findMany({
      select: { id: true, name: true },
      orderBy: { name: this.sortOrder },
    })
  }

  /**
   * Get statistics about brands
   */
  async stats(): Promise<{
    total: number
    withDevices: number
    withoutDevices: number
  }> {
    const [withDevices, withoutDevices] = await Promise.all([
      this.prisma.deviceBrand.count({ where: { devices: { some: {} } } }),
      this.prisma.deviceBrand.count({ where: { devices: { none: {} } } }),
    ])

    return {
      total: withDevices + withoutDevices,
      withDevices,
      withoutDevices,
    }
  }
}
