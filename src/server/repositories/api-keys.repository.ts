import { startOfMinute, startOfWeek, startOfMonth, subHours } from 'date-fns'
import { API_KEY_LIMITS, PAGINATION } from '@/data/constants'
import { AppError, ResourceError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import {
  CreateApiKeySchema,
  ListApiKeysSchema,
  UpdateApiKeyQuotaSchema,
  type CreateApiKeyInput,
  type ListApiKeysInput,
  type UpdateApiKeyQuotaInput,
} from '@/schemas/apiAccess'
import {
  calculateOffset,
  paginate,
  buildOrderBy,
  type PaginationResult,
} from '@/server/utils/pagination'
import { Prisma, ApiUsagePeriod, type PrismaClient } from '@orm'
import { BaseRepository } from './base.repository'

const USAGE_WINDOW_FACTORY: Record<ApiUsagePeriod, (now: Date) => Date> = {
  [ApiUsagePeriod.MINUTE]: (now) => startOfMinute(now),
  [ApiUsagePeriod.WEEK]: (now) => startOfWeek(now, { weekStartsOn: 1 }),
  [ApiUsagePeriod.MONTH]: (now) => startOfMonth(now),
}

export type ApiKeyWithUser = Prisma.ApiKeyGetPayload<{
  include: typeof ApiKeysRepository.includes.base
}>

export type ApiKeyUsageWindow = Prisma.ApiKeyUsageGetPayload<{
  select: typeof ApiKeyUsageRepository.selectors.series
}>

export interface ApiKeyStats {
  total: number
  active: number
  system: number
  recentRequests: number
}

export class ApiKeysRepository extends BaseRepository {
  static readonly includes = {
    base: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          showNsfw: true,
        },
      },
    } satisfies Prisma.ApiKeyInclude,
  } as const

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    super(prisma as PrismaClient)
  }

  async create(
    data: CreateApiKeyInput & {
      userId: string
      prefix: string
      secretHash: string
      salt: string
    },
  ): Promise<ApiKeyWithUser> {
    const parsed = CreateApiKeySchema.parse(data)

    logger.debug('[ApiKeysRepository] create input', {
      userId: data.userId,
      isSystemKey: data.isSystemKey,
      monthlyQuota: data.monthlyQuota,
      weeklyQuota: data.weeklyQuota,
      burstQuota: data.burstQuota,
      expiresAt: data.expiresAt,
    })

    return this.handleDatabaseOperation(() =>
      this.prisma.apiKey.create({
        data: {
          userId: data.userId,
          name: parsed.name,
          prefix: data.prefix,
          secretHash: data.secretHash,
          salt: data.salt,
          monthlyQuota:
            parsed.monthlyQuota === undefined
              ? API_KEY_LIMITS.DEFAULT_MONTHLY
              : (parsed.monthlyQuota ?? 0),
          weeklyQuota:
            parsed.weeklyQuota === undefined
              ? API_KEY_LIMITS.DEFAULT_WEEKLY
              : (parsed.weeklyQuota ?? 0),
          burstQuota:
            parsed.burstQuota === undefined
              ? API_KEY_LIMITS.DEFAULT_BURST_PER_MINUTE
              : (parsed.burstQuota ?? 0),
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
          isSystemKey: parsed.isSystemKey ?? false,
        },
        include: ApiKeysRepository.includes.base,
      }),
    )
  }

  async byId(id: string): Promise<ApiKeyWithUser | null> {
    return this.handleDatabaseOperation(() =>
      this.prisma.apiKey.findUnique({
        where: { id },
        include: ApiKeysRepository.includes.base,
      }),
    )
  }

  async byPrefix(prefix: string): Promise<ApiKeyWithUser | null> {
    return this.handleDatabaseOperation(() =>
      this.prisma.apiKey.findUnique({
        where: { prefix },
        include: ApiKeysRepository.includes.base,
      }),
    )
  }

  async list(
    filters: ListApiKeysInput = {},
  ): Promise<{ keys: ApiKeyWithUser[]; pagination: PaginationResult }> {
    const parsed = ListApiKeysSchema.parse(filters)
    const limit = parsed.limit ?? PAGINATION.DEFAULT_LIMIT
    const offset = calculateOffset({ page: parsed.page }, limit)

    const where: Prisma.ApiKeyWhereInput = {
      ...(parsed.search && {
        OR: [
          { prefix: { contains: parsed.search, mode: this.mode } },
          { name: { contains: parsed.search, mode: this.mode } },
          { user: { email: { contains: parsed.search, mode: this.mode } } },
        ],
      }),
      ...(parsed.userId && { userId: parsed.userId }),
      ...(parsed.includeRevoked
        ? {}
        : {
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          }),
    }

    const orderBy = buildOrderBy<Prisma.ApiKeyOrderByWithRelationInput>(
      {
        name: (direction) => ({ name: direction }),
        createdAt: (direction) => ({ createdAt: direction }),
        lastUsedAt: (direction) => ({ lastUsedAt: direction }),
        monthlyQuota: (direction) => ({ monthlyQuota: direction }),
      },
      parsed.sortField,
      parsed.sortDirection,
      { createdAt: Prisma.SortOrder.desc },
    )

    const orderClauses = orderBy.length > 0 ? orderBy : [{ createdAt: Prisma.SortOrder.desc }]

    const [total, keys] = await this.handleDatabaseOperation(async () =>
      this.prisma.$transaction([
        this.prisma.apiKey.count({ where }),
        this.prisma.apiKey.findMany({
          where,
          include: ApiKeysRepository.includes.base,
          orderBy: orderClauses,
          take: limit,
          skip: offset,
        }),
      ]),
    )

    const page = parsed.page ?? Math.floor(offset / limit) + 1

    return {
      keys,
      pagination: paginate({ total, page, limit }),
    }
  }

  async updateQuotas(input: UpdateApiKeyQuotaInput): Promise<ApiKeyWithUser> {
    const parsed = UpdateApiKeyQuotaSchema.parse(input)

    return this.handleDatabaseOperation(async () => {
      const existing = await this.prisma.apiKey.findUnique({ where: { id: parsed.id } })
      if (!existing) ResourceError.apiKey.notFound()

      return this.prisma.apiKey.update({
        where: { id: parsed.id },
        data: {
          ...(parsed.monthlyQuota !== undefined && { monthlyQuota: parsed.monthlyQuota ?? 0 }),
          ...(parsed.weeklyQuota !== undefined && { weeklyQuota: parsed.weeklyQuota ?? 0 }),
          ...(parsed.burstQuota !== undefined && { burstQuota: parsed.burstQuota ?? 0 }),
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        },
        include: ApiKeysRepository.includes.base,
      })
    })
  }

  async revoke(id: string, revokedAt = new Date()): Promise<void> {
    await this.handleDatabaseOperation(async () => {
      const key = await this.prisma.apiKey.findUnique({ where: { id } })
      if (!key) {
        ResourceError.apiKey.notFound()
        return
      }
      if (key.revokedAt) return

      await this.prisma.apiKey.update({
        where: { id },
        data: { revokedAt, updatedAt: new Date() },
      })
    })
  }

  async markUsage(id: string, timestamp = new Date()): Promise<void> {
    await this.handleDatabaseOperation(() =>
      this.prisma.apiKey.update({
        where: { id },
        data: {
          requestCount: { increment: 1 },
          lastUsedAt: timestamp,
        },
      }),
    )
  }

  async delete(id: string): Promise<void> {
    await this.handleDatabaseOperation(() => this.prisma.apiKey.delete({ where: { id } }))
  }

  async stats(filters: { userId?: string } = {}): Promise<ApiKeyStats> {
    const now = new Date()
    const baseWhere: Prisma.ApiKeyWhereInput = {}
    if (filters.userId) baseWhere.userId = filters.userId

    const activeWhere: Prisma.ApiKeyWhereInput = {
      ...baseWhere,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    }

    const systemWhere: Prisma.ApiKeyWhereInput = {
      ...baseWhere,
      isSystemKey: true,
    }

    const twentyFourHoursAgo = subHours(now, 24)

    const [total, active, system, recentUsage] = await this.handleDatabaseOperation(() =>
      this.prisma.$transaction([
        this.prisma.apiKey.count({ where: baseWhere }),
        this.prisma.apiKey.count({ where: activeWhere }),
        this.prisma.apiKey.count({ where: systemWhere }),
        this.prisma.apiKeyUsage.aggregate({
          _sum: { requestCount: true },
          where: {
            period: ApiUsagePeriod.MINUTE,
            windowStart: { gte: twentyFourHoursAgo },
            ...(filters.userId && { apiKey: { userId: filters.userId } }),
          },
        }),
      ]),
    )

    return {
      total,
      active,
      system,
      recentRequests: recentUsage._sum.requestCount ?? 0,
    }
  }
}

export class ApiKeyUsageRepository extends BaseRepository {
  static readonly selectors = {
    series: {
      id: true,
      period: true,
      windowStart: true,
      requestCount: true,
      firstRequestAt: true,
      lastRequestAt: true,
    } satisfies Prisma.ApiKeyUsageSelect,
  } as const

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    super(prisma as PrismaClient)
  }

  async incrementWithinLimit(
    apiKeyId: string,
    period: ApiUsagePeriod,
    limit: number,
    now: Date,
  ): Promise<void> {
    if (limit <= 0) return

    const windowStart = USAGE_WINDOW_FACTORY[period](now)

    const updateResult = await this.handleDatabaseOperation(
      () =>
        this.prisma.apiKeyUsage.updateMany({
          where: {
            apiKeyId,
            period,
            windowStart,
            requestCount: { lt: limit },
          },
          data: {
            requestCount: { increment: 1 },
            lastRequestAt: now,
          },
        }),
      'api key usage increment',
    )
    if (updateResult.count === 1) return

    try {
      await this.prisma.apiKeyUsage.create({
        data: {
          apiKeyId,
          period,
          windowStart,
          requestCount: 1,
          firstRequestAt: now,
          lastRequestAt: now,
        },
      })
      return
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const retryResult = await this.handleDatabaseOperation(
          () =>
            this.prisma.apiKeyUsage.updateMany({
              where: {
                apiKeyId,
                period,
                windowStart,
                requestCount: { lt: limit },
              },
              data: {
                requestCount: { increment: 1 },
                lastRequestAt: now,
              },
            }),
          'api key usage increment retry',
        )

        if (retryResult.count === 1) return
      } else {
        throw error
      }
    }

    AppError.tooManyRequests()
  }

  async getSeries(
    apiKeyId: string,
    period: ApiUsagePeriod,
    limit: number,
  ): Promise<ApiKeyUsageWindow[]> {
    return this.handleDatabaseOperation(() =>
      this.prisma.apiKeyUsage.findMany({
        where: { apiKeyId, period },
        select: ApiKeyUsageRepository.selectors.series,
        orderBy: { windowStart: 'desc' },
        take: limit,
      }),
    )
  }

  async resetOlderThan(apiKeyId: string, period: ApiUsagePeriod, cutoff: Date): Promise<void> {
    await this.handleDatabaseOperation(() =>
      this.prisma.apiKeyUsage.deleteMany({
        where: {
          apiKeyId,
          period,
          windowStart: { lt: cutoff },
        },
      }),
    )
  }
}
