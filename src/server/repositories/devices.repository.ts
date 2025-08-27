import { ResourceError } from '@/lib/errors'
import {
  calculateOffset,
  createPaginationResult,
  type PaginationResult,
} from '@/server/utils/pagination'
import { Prisma, ApprovalStatus } from '@orm'
import { BaseRepository } from './base.repository'
import type { GetDevicesInput, CreateDeviceInput, UpdateDeviceInput } from '@/schemas/device'

/**
 * Repository for Device data access
 */
export class DevicesRepository extends BaseRepository {
  static readonly includes = {
    default: {
      brand: true,
      soc: true,
    } satisfies Prisma.DeviceInclude,

    withCounts: {
      brand: true,
      soc: true,
      _count: { select: { listings: true } },
    } satisfies Prisma.DeviceInclude,

    forMobile: {
      brand: { select: { id: true, name: true } },
      soc: { select: { id: true, name: true, manufacturer: true } },
      _count: { select: { listings: true } },
    } satisfies Prisma.DeviceInclude,
  } as const

  async byId(id: string): Promise<Prisma.DeviceGetPayload<{
    include: typeof DevicesRepository.includes.default
  }> | null> {
    return this.prisma.device.findUnique({
      where: { id },
      include: DevicesRepository.includes.default,
    })
  }

  async create(data: CreateDeviceInput): Promise<
    Prisma.DeviceGetPayload<{
      include: typeof DevicesRepository.includes.default
    }>
  > {
    // Check for duplicate
    const exists = await this.existsByModelAndBrand(data.modelName, data.brandId)
    if (exists) throw ResourceError.device.alreadyExists(data.modelName)

    // Validate brand exists
    const brand = await this.prisma.deviceBrand.findUnique({ where: { id: data.brandId } })
    if (!brand) throw ResourceError.deviceBrand.notFound()

    // Validate SoC if provided
    if (data.socId) {
      const soc = await this.prisma.soC.findUnique({ where: { id: data.socId } })
      if (!soc) throw ResourceError.soc.notFound()
    }

    return this.handleDatabaseOperation(
      () =>
        this.prisma.device.create({
          data: {
            ...data,
            socId: data.socId ?? null,
          },
          include: DevicesRepository.includes.default,
        }),
      'Device',
    )
  }

  async update(
    id: string,
    data: Partial<UpdateDeviceInput>,
  ): Promise<
    Prisma.DeviceGetPayload<{
      include: typeof DevicesRepository.includes.default
    }>
  > {
    // Check if device exists
    const device = await this.byId(id)
    if (!device) throw ResourceError.device.notFound()

    // Check for duplicate if model/brand being updated
    if (data.modelName || data.brandId) {
      const modelName = data.modelName ?? device.modelName
      const brandId = data.brandId ?? device.brandId
      const exists = await this.existsByModelAndBrand(modelName, brandId)
      if (exists && exists !== id) {
        throw ResourceError.device.alreadyExists(modelName)
      }
    }

    // Validate brand if being updated
    if (data.brandId) {
      const brand = await this.prisma.deviceBrand.findUnique({ where: { id: data.brandId } })
      if (!brand) throw ResourceError.deviceBrand.notFound()
    }

    // Validate SoC if being updated
    if (data.socId) {
      const soc = await this.prisma.soC.findUnique({ where: { id: data.socId } })
      if (!soc) throw ResourceError.soc.notFound()
    }

    return this.handleDatabaseOperation(
      () =>
        this.prisma.device.update({
          where: { id },
          data: {
            ...data,
            socId: data.socId ?? undefined,
          },
          include: DevicesRepository.includes.default,
        }),
      'Device',
    )
  }

  async delete(id: string): Promise<void> {
    // Check if device exists and has listings
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: { _count: { select: { listings: true } } },
    })

    if (!device) throw ResourceError.device.notFound()
    if (device._count.listings > 0) {
      throw ResourceError.device.inUse(device._count.listings)
    }

    await this.handleDatabaseOperation(() => this.prisma.device.delete({ where: { id } }), 'Device')
  }

  async list(input: GetDevicesInput = {}): Promise<{
    devices: Prisma.DeviceGetPayload<{ include: typeof DevicesRepository.includes.withCounts }>[]
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

  async existsByModelAndBrand(modelName: string, brandId: string): Promise<boolean | string> {
    const device = await this.prisma.device.findFirst({
      where: { modelName, brandId },
      select: { id: true },
    })
    return device ? device.id : false
  }

  async byIdWithCounts(id: string): Promise<Prisma.DeviceGetPayload<{
    include: typeof DevicesRepository.includes.withCounts
  }> | null> {
    return this.prisma.device.findUnique({
      where: { id },
      include: DevicesRepository.includes.withCounts,
    })
  }

  async findUnique(
    modelName: string,
    brandId: string,
  ): Promise<Prisma.DeviceGetPayload<{
    include: typeof DevicesRepository.includes.default
  }> | null> {
    return this.prisma.device.findFirst({
      where: { modelName, brandId },
      include: DevicesRepository.includes.default,
    })
  }

  async listMobile(filters: GetDevicesInput = {}): Promise<{
    devices: {
      id: string
      modelName: string
      brandName: string
      socName: string | null
      listingsCount: number
    }[]
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
  async byIdMobile(id: string): Promise<Prisma.DeviceGetPayload<{
    include: typeof DevicesRepository.includes.forMobile
  }> | null> {
    return this.prisma.device.findUnique({
      where: { id },
      include: DevicesRepository.includes.forMobile,
    })
  }

  /**
   * Get statistics about devices
   */
  async stats(): Promise<{
    total: number
    withListings: number
    withoutListings: number
  }> {
    const [withListings, withoutListings] = await Promise.all([
      this.prisma.device.count({ where: { listings: { some: {} } } }),
      this.prisma.device.count({ where: { listings: { none: {} } } }),
    ])

    return {
      total: withListings + withoutListings,
      withListings,
      withoutListings,
    }
  }
}
