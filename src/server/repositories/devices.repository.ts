import { startOfMonth, subDays } from 'date-fns'
import { HOME_PAGE_LIMITS } from '@/data/constants'
import { ResourceError } from '@/lib/errors'
import { type PaginationResult, paginate, calculateOffset } from '@/server/utils/pagination'
import { Prisma, ApprovalStatus } from '@orm'
import { BaseRepository } from './base.repository'
import type { TimeRangeId } from '@/app/home/components/TimeRangeTabs'
import type { GetDevicesInput, CreateDeviceInput, UpdateDeviceInput } from '@/schemas/device'

export interface TrendingDevice {
  id: string
  modelName: string
  brandName: string
  brandId: string
  socName: string | null
  recentListingCount: number
}

export interface TrendingDevicesSummary {
  allTime: TrendingDevice[]
  thisMonth: TrendingDevice[]
  thisWeek: TrendingDevice[]
}

/**
 * Repository for Device data access
 */
export class DevicesRepository extends BaseRepository {
  static readonly includes = {
    default: {
      brand: true,
      soc: true,
    } satisfies Prisma.DeviceInclude,

    limited: {
      brand: { select: { id: true, name: true } },
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

  static readonly selects = {
    trending: {
      id: true,
      modelName: true,
      brand: { select: { id: true, name: true } },
      soc: { select: { id: true, name: true, manufacturer: true } },
    } satisfies Prisma.DeviceSelect,
  } as const

  async byId(id: string): Promise<Prisma.DeviceGetPayload<{
    include: typeof DevicesRepository.includes.default
  }> | null> {
    return this.prisma.device.findUnique({
      where: { id },
      include: DevicesRepository.includes.default,
    })
  }

  /**
   * Get Devices by a list of IDs (limited include)
   */
  async listByIds(ids: string[]) {
    if (ids.length === 0) return []
    return this.prisma.device.findMany({
      where: { id: { in: ids } },
      include: DevicesRepository.includes.limited,
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
          data: { ...data, socId: data.socId ?? null },
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
      if (exists && exists !== id) throw ResourceError.device.alreadyExists(modelName)
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
          data: { ...data, socId: data.socId ?? undefined },
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
    const actualOffset = calculateOffset({ page: input.page, offset: input.offset }, limit)

    const where: Prisma.DeviceWhereInput = {}

    if (input.brandId) where.brandId = input.brandId
    if (input.search) {
      const searchWords = input.search.trim().split(/\s+/)

      // Each word must appear in either brand or model name
      where.AND = searchWords.map((word) => ({
        OR: [
          { modelName: { contains: word, mode: this.mode } },
          { brand: { name: { contains: word, mode: this.mode } } },
        ],
      }))
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

    const pagination = paginate({
      total: total,
      page: input.page ?? Math.floor(actualOffset / limit) + 1,
      limit: limit,
    })

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

  /**
   * Find device by model name and brand name (for catalog integration)
   * Case-insensitive search
   */
  async findByModelAndBrandName(
    modelName: string,
    brandName: string,
  ): Promise<Prisma.DeviceGetPayload<{
    include: typeof DevicesRepository.includes.default
  }> | null> {
    return this.prisma.device.findFirst({
      where: {
        modelName: { equals: modelName, mode: this.mode },
        brand: { name: { equals: brandName, mode: this.mode } },
      },
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
    pagination: PaginationResult
  }> {
    const limit = filters.limit ?? 20
    const page = filters.page ?? 1
    const actualOffset = calculateOffset({ page }, limit)

    const where: Prisma.DeviceWhereInput = {}

    if (filters.brandId) where.brandId = filters.brandId
    if (filters.search) {
      const searchWords = filters.search.trim().split(/\s+/)

      where.AND = searchWords.map((word) => ({
        OR: [
          { modelName: { contains: word, mode: this.mode } },
          { brand: { name: { contains: word, mode: this.mode } } },
        ],
      }))
    }

    const [devices, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        select: {
          id: true,
          modelName: true,
          brand: { select: { name: true } },
          soc: { select: { name: true } },
          _count: { select: { listings: { where: { status: ApprovalStatus.APPROVED } } } },
        },
        orderBy: [
          { listings: { _count: Prisma.SortOrder.desc } },
          { brand: { name: this.sortOrder } },
          { modelName: this.sortOrder },
        ],
        skip: actualOffset,
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
      pagination: paginate({ total, page, limit }),
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

  /**
   * Resolves a time range ID to a start date
   */
  private resolveTimeRange(timeRange: TimeRangeId): Date | undefined {
    if (timeRange === 'allTime') return undefined

    const now = new Date()

    if (timeRange === 'thisWeek') return subDays(now, 7)

    return startOfMonth(now)
  }

  /**
   * Get trending devices based on listings submitted since a given date.
   * Uses raw SQL to properly order by filtered listing count.
   */
  async getTrendingDevices(
    limit: number = HOME_PAGE_LIMITS.TRENDING_DEVICES,
    sinceDate?: Date,
  ): Promise<TrendingDevice[]> {
    // Build the date filter condition
    const dateFilter = sinceDate ? Prisma.sql`AND l."createdAt" >= ${sinceDate}` : Prisma.sql``

    const results = await this.prisma.$queryRaw<
      {
        id: string
        modelName: string
        brandId: string
        brandName: string
        socManufacturer: string | null
        socName: string | null
        listingCount: bigint
      }[]
    >(Prisma.sql`
      SELECT
        d.id,
        d."modelName",
        b.id as "brandId",
        b.name as "brandName",
        s.manufacturer as "socManufacturer",
        s.name as "socName",
        COUNT(l.id) as "listingCount"
      FROM "Device" d
      INNER JOIN "DeviceBrand" b ON d."brandId" = b.id
      LEFT JOIN "SoC" s ON d."socId" = s.id
      INNER JOIN "Listing" l ON l."deviceId" = d.id
      WHERE l.status = 'APPROVED'
        ${dateFilter}
      GROUP BY d.id, b.id, b.name, s.manufacturer, s.name
      ORDER BY "listingCount" DESC
      LIMIT ${limit}
    `)

    return results.map((row) => ({
      id: row.id,
      modelName: row.modelName,
      brandName: row.brandName,
      brandId: row.brandId,
      socName: row.socManufacturer && row.socName ? `${row.socManufacturer} ${row.socName}` : null,
      recentListingCount: Number(row.listingCount),
    }))
  }

  /**
   * Get trending devices for all time ranges
   */
  async getTrendingDevicesSummary(
    limit: number = HOME_PAGE_LIMITS.TRENDING_DEVICES,
  ): Promise<TrendingDevicesSummary> {
    const timeRanges: TimeRangeId[] = ['allTime', 'thisMonth', 'thisWeek']

    const results = await Promise.all(
      timeRanges.map((range) => this.getTrendingDevices(limit, this.resolveTimeRange(range))),
    )
    const [allTime, thisMonth, thisWeek] = results

    return { allTime, thisMonth, thisWeek }
  }
}
