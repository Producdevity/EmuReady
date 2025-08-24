import { Prisma, type SoC } from '@orm'
import { BaseRepository } from './base.repository'
import type { GetSoCsInput, CreateSoCInput, UpdateSoCInput } from '@/schemas/soc'

/**
 * Repository for SoC (System on Chip) data access
 */
export class SoCsRepository extends BaseRepository {
  async get(filters: GetSoCsInput = {}): Promise<SoC[]> {
    const sortDirection = filters.sortDirection ?? this.sortOrder
    const sortField = filters.sortField ?? 'name'
    const { limit = 20, offset = 0 } = filters

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

    return this.prisma.soC.findMany({ where, orderBy, take: limit, skip: offset })
  }

  async byId(id: string): Promise<SoC | null> {
    return this.prisma.soC.findUnique({ where: { id } })
  }

  async create(data: CreateSoCInput): Promise<SoC> {
    return this.prisma.soC.create({
      data: {
        ...data,
        architecture: data.architecture ?? null,
        processNode: data.processNode ?? null,
        cpuCores: data.cpuCores ?? null,
        gpuModel: data.gpuModel ?? null,
      },
    })
  }

  async update(id: string, data: Partial<UpdateSoCInput>): Promise<SoC> {
    return this.prisma.soC.update({
      where: { id },
      data: {
        ...data,
        architecture: data.architecture ?? undefined,
        processNode: data.processNode ?? undefined,
        cpuCores: data.cpuCores ?? undefined,
        gpuModel: data.gpuModel ?? undefined,
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.soC.delete({ where: { id } })
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
  async getWithDeviceCounts(): Promise<(SoC & { _count: { devices: number } })[]> {
    return this.prisma.soC.findMany({
      include: { _count: { select: { devices: true } } },
      orderBy: { devices: { _count: Prisma.SortOrder.desc } },
    })
  }

  /**
   * Get SoCs by manufacturer
   */
  async getByManufacturer(manufacturer: string): Promise<SoC[]> {
    return this.prisma.soC.findMany({
      where: { manufacturer: { equals: manufacturer, mode: this.mode } },
      orderBy: { name: this.sortOrder },
    })
  }

  /**
   * Get SoCs with their devices
   */
  async getWithDevices(
    socId: string,
  ): Promise<
    (SoC & { devices: { id: string; modelName: string; brand: { name: string } }[] }) | null
  > {
    return this.prisma.soC.findUnique({
      where: { id: socId },
      include: {
        devices: { select: { id: true, modelName: true, brand: { select: { name: true } } } },
      },
    })
  }

  /**
   * Get unique manufacturers
   */
  async getManufacturers(): Promise<string[]> {
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
  async getAllForMobile(): Promise<{ id: string; name: string; manufacturer: string }[]> {
    return this.prisma.soC.findMany({
      select: { id: true, name: true, manufacturer: true },
      orderBy: [{ manufacturer: this.sortOrder }, { name: this.sortOrder }],
    })
  }
}
