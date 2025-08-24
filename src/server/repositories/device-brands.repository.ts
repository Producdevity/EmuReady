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
  async get(filters: GetDeviceBrandsInput = {}): Promise<DeviceBrand[]> {
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
      orderBy,
      take: limit,
    })
  }

  async byId(id: string): Promise<DeviceBrand | null> {
    return this.prisma.deviceBrand.findUnique({ where: { id } })
  }

  async create(data: CreateDeviceBrandInput): Promise<DeviceBrand> {
    return this.prisma.deviceBrand.create({ data })
  }

  async update(id: string, data: Partial<UpdateDeviceBrandInput>): Promise<DeviceBrand> {
    return this.prisma.deviceBrand.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.deviceBrand.delete({ where: { id } })
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
  async getWithDeviceCounts(): Promise<(DeviceBrand & { _count: { devices: number } })[]> {
    return this.prisma.deviceBrand.findMany({
      include: {
        _count: {
          select: { devices: true },
        },
      },
      orderBy: {
        devices: { _count: Prisma.SortOrder.desc },
      },
    })
  }

  /**
   * Get all brands for mobile (simple list sorted alphabetically)
   */
  async getAllForMobile(): Promise<{ id: string; name: string }[]> {
    return this.prisma.deviceBrand.findMany({
      select: { id: true, name: true },
      orderBy: { name: this.sortOrder },
    })
  }
}
