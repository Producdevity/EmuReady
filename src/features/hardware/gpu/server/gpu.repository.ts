import { PrismaWriteRepository } from '@/server/persistence/prisma.repository'
import { paginationResult } from '@/server/utils/pagination'
import { type GpuWriteContext, translateGpuWriteError } from './persistence/gpu.errors'
import {
  GPU_DELETE_GUARD_SELECT,
  GPU_DETAIL_SELECT,
  GPU_MOBILE_LIST_SELECT,
  GPU_MOBILE_PC_LISTING_SELECT,
  GPU_MODEL_CONFLICT_SELECT,
  GPU_SUMMARY_SELECT,
} from './persistence/gpu.prisma'
import {
  buildGpuListQuery,
  buildGpuModelNameConflictWhere,
  buildGpuOptionsQuery,
  buildMobileGpuListQuery,
  buildMobilePcListingGpuQuery,
} from './persistence/gpu.query'
import type {
  GpuDetailRecord,
  GpuDeleteGuardRecord,
  GpuListResult,
  GpuMobileListResult,
  GpuMobilePcListingResult,
  GpuModelNameConflictInput,
  GpuModelNameConflictRecord,
  GpuOptionsFilters,
  GpuOptionsResult,
  GpuSummaryRecord,
  UpdateGpuData,
} from './gpu.repository.types'
import type {
  CreateGpuInput,
  GetGpusInput,
  MobileGetGpusInput,
  MobilePcListingGpusInput,
} from '../shared/gpu.types'

export class GpuRepository extends PrismaWriteRepository<GpuWriteContext> {
  protected translateWriteError(error: unknown, context: GpuWriteContext): never {
    return translateGpuWriteError(error, context)
  }

  async byIdWithCounts(id: string): Promise<GpuDetailRecord | null> {
    return this.prisma.gpu.findUnique({
      where: { id },
      select: GPU_DETAIL_SELECT,
    })
  }

  async findDeleteGuardById(id: string): Promise<GpuDeleteGuardRecord | null> {
    return this.prisma.gpu.findUnique({
      where: { id },
      select: GPU_DELETE_GUARD_SELECT,
    })
  }

  async listByIds(ids: string[]): Promise<GpuSummaryRecord[]> {
    if (ids.length === 0) return []

    return this.prisma.gpu.findMany({
      where: { id: { in: ids } },
      select: GPU_SUMMARY_SELECT,
    })
  }

  async list(filters: GetGpusInput = {}): Promise<GpuListResult> {
    const query = buildGpuListQuery(filters)

    const [gpus, total] = await Promise.all([
      this.prisma.gpu.findMany({
        where: query.where,
        select: GPU_DETAIL_SELECT,
        orderBy: query.orderBy,
        take: query.pagination.limit,
        skip: query.pagination.offset,
      }),
      this.prisma.gpu.count({ where: query.where }),
    ])

    return {
      gpus,
      pagination: paginationResult(total, query.pagination),
    }
  }

  async listMobileCompatibility(filters: MobileGetGpusInput = {}): Promise<GpuMobileListResult> {
    const query = buildMobileGpuListQuery(filters)

    const [gpus, total] = await Promise.all([
      this.prisma.gpu.findMany({
        where: query.where,
        select: GPU_MOBILE_LIST_SELECT,
        orderBy: query.orderBy,
        take: query.pagination.limit,
        skip: query.pagination.offset,
      }),
      this.prisma.gpu.count({ where: query.where }),
    ])

    return {
      gpus,
      pagination: paginationResult(total, query.pagination),
    }
  }

  async byIdMobileCompatibility(id: string): Promise<GpuMobileListResult['gpus'][number] | null> {
    return this.prisma.gpu.findUnique({
      where: { id },
      select: GPU_MOBILE_LIST_SELECT,
    })
  }

  async pcListingMobileGpuCompatibility(
    filters: MobilePcListingGpusInput,
  ): Promise<GpuMobilePcListingResult> {
    const query = buildMobilePcListingGpuQuery(filters)
    const gpus = await this.prisma.gpu.findMany({
      where: query.where,
      select: GPU_MOBILE_PC_LISTING_SELECT,
      orderBy: query.orderBy,
      take: query.limit,
    })

    return { gpus }
  }

  async options(filters: GpuOptionsFilters = {}): Promise<GpuOptionsResult> {
    const query = buildGpuOptionsQuery(filters)
    const gpus = await this.prisma.gpu.findMany({
      where: query.where,
      select: GPU_SUMMARY_SELECT,
      orderBy: query.orderBy,
      take: query.limit + 1,
      skip: query.offset,
    })

    return {
      gpus: gpus.slice(0, query.limit),
      hasMore: gpus.length > query.limit,
    }
  }

  async findModelNameConflict(
    input: GpuModelNameConflictInput,
  ): Promise<GpuModelNameConflictRecord | null> {
    return this.prisma.gpu.findFirst({
      where: buildGpuModelNameConflictWhere(input),
      select: GPU_MODEL_CONFLICT_SELECT,
    })
  }

  async create(data: CreateGpuInput): Promise<GpuDetailRecord> {
    return this.executeWrite(() => this.prisma.gpu.create({ data, select: GPU_DETAIL_SELECT }), {
      action: 'create',
      modelName: data.modelName,
    })
  }

  async update(id: string, data: UpdateGpuData): Promise<GpuDetailRecord> {
    return this.executeWrite(
      () => this.prisma.gpu.update({ where: { id }, data, select: GPU_DETAIL_SELECT }),
      { action: 'update', modelName: data.modelName },
    )
  }

  async delete(id: string): Promise<void> {
    await this.executeWrite(() => this.prisma.gpu.delete({ where: { id }, select: { id: true } }), {
      action: 'delete',
    })
  }

  async stats(): Promise<{
    total: number
    withListings: number
    withoutListings: number
  }> {
    const [withListings, withoutListings] = await Promise.all([
      this.prisma.gpu.count({ where: { pcListings: { some: {} } } }),
      this.prisma.gpu.count({ where: { pcListings: { none: {} } } }),
    ])

    return {
      total: withListings + withoutListings,
      withListings,
      withoutListings,
    }
  }
}
