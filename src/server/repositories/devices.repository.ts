import {
  calculateOffset,
  createPaginationResult,
  type PaginationResult,
} from '@/server/utils/pagination'
import { Prisma, ApprovalStatus } from '@orm'
import { BaseRepository } from './base.repository'
import type { GetDevicesInput, CreateDeviceInput, UpdateDeviceInput } from '@/schemas/device'

// Type helpers using const assertions for DRY type inference
const deviceIncludes = {
  default: {
    brand: true,
    soc: true,
  },
  withCounts: {
    brand: true,
    soc: true,
    _count: { select: { listings: true } },
  },
} as const

// Inferred types from the includes
type DeviceDefault = Prisma.DeviceGetPayload<{ include: typeof deviceIncludes.default }>
type DeviceWithCounts = Prisma.DeviceGetPayload<{ include: typeof deviceIncludes.withCounts }>

/**
 * Repository for Device data access
 */
export class DevicesRepository extends BaseRepository {
  // Use the const includes defined above
  static readonly includes = deviceIncludes

  async byId(id: string): Promise<DeviceDefault | null> {
    return this.prisma.device.findUnique({
      where: { id },
      include: DevicesRepository.includes.default,
    })
  }

  async create(data: CreateDeviceInput): Promise<DeviceDefault> {
    return this.prisma.device.create({
      data: {
        ...data,
        socId: data.socId ?? null,
      },
      include: DevicesRepository.includes.default,
    })
  }

  async update(id: string, data: Partial<UpdateDeviceInput>): Promise<DeviceDefault> {
    return this.prisma.device.update({
      where: { id },
      data: {
        ...data,
        socId: data.socId ?? undefined,
      },
      include: DevicesRepository.includes.default,
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.device.delete({ where: { id } })
  }

  async getPaginated(input: GetDevicesInput = {}): Promise<{
    devices: DeviceWithCounts[]
    pagination: PaginationResult
  }> {
    const limit = input.limit ?? 20
    const actualOffset = calculateOffset(
      { page: input.page ?? undefined, offset: input.offset ?? undefined },
      limit,
    )

    const where: Prisma.DeviceWhereInput = {}

    if (input.brandId) where.brandId = input.brandId
    if (input.search) {
      where.OR = [
        { modelName: { contains: input.search, mode: this.mode } },
        { brand: { name: { contains: input.search, mode: this.mode } } },
      ]
    }

    const [total, devices] = await Promise.all([
      this.prisma.device.count({ where }),
      this.prisma.device.findMany({
        where,
        include: DevicesRepository.includes.withCounts,
        orderBy: [{ brand: { name: this.sortOrder } }, { modelName: this.sortOrder }],
        skip: actualOffset,
        take: limit,
      }),
    ])

    const pagination = createPaginationResult(
      total,
      { page: input.page ?? undefined, offset: input.offset ?? undefined },
      limit,
      actualOffset,
    )

    return { devices, pagination }
  }

  async existsByModelAndBrand(modelName: string, brandId: string): Promise<boolean> {
    const device = await this.prisma.device.findFirst({
      where: { modelName, brandId },
    })
    return !!device
  }

  async byIdWithCounts(id: string): Promise<DeviceWithCounts | null> {
    return this.prisma.device.findUnique({
      where: { id },
      include: DevicesRepository.includes.withCounts,
    })
  }

  async findUnique(modelName: string, brandId: string): Promise<DeviceDefault | null> {
    return this.prisma.device.findFirst({
      where: { modelName, brandId },
      include: DevicesRepository.includes.default,
    })
  }

  async getMobile(filters: GetDevicesInput = {}): Promise<{
    devices: Array<{
      id: string
      modelName: string
      brandName: string
      socName: string | null
      listingsCount: number
    }>
    pagination: {
      total: number
      pages: number
      page: number
      limit: number
    }
  }> {
    const limit = filters.limit ?? 20
    const page = filters.page ?? 1
    const skip = (page - 1) * limit

    const where: Prisma.DeviceWhereInput = {}

    if (filters.brandId) where.brandId = filters.brandId
    if (filters.search) {
      where.OR = [
        { modelName: { contains: filters.search, mode: this.mode } },
        { brand: { name: { contains: filters.search, mode: this.mode } } },
      ]
    }

    const [devices, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        select: {
          id: true,
          modelName: true,
          brand: { select: { name: true } },
          soc: { select: { name: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [
          { listings: { _count: Prisma.SortOrder.desc } },
          { brand: { name: this.sortOrder } },
          { modelName: this.sortOrder },
        ],
        skip,
        take: limit,
      }),
      this.prisma.device.count({ where }),
    ])

    return {
      devices: devices.map((device) => ({
        id: device.id,
        modelName: device.modelName,
        brandName: device.brand.name,
        socName: device.soc?.name ?? null,
        listingsCount: device._count.listings,
      })),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    }
  }

  /**
   * Get device by ID for mobile with related data
   */
  async getByIdMobile(id: string): Promise<Prisma.DeviceGetPayload<{
    include: {
      brand: { select: { id: true; name: true } }
      soc: { select: { id: true; name: true; manufacturer: true } }
      _count: { select: { listings: true } }
    }
  }> | null> {
    return this.prisma.device.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true } },
        soc: { select: { id: true, name: true, manufacturer: true } },
        _count: { select: { listings: true } },
      },
    })
  }
}
