import { PrismaWriteRepository } from '@/server/persistence/prisma.repository'
import { paginationResult } from '@/server/utils/pagination'
import { type CpuWriteContext, translateCpuWriteError } from './persistence/cpu.errors'
import {
  CPU_DELETE_GUARD_SELECT,
  CPU_DETAIL_SELECT,
  CPU_MOBILE_LIST_SELECT,
  CPU_MOBILE_PC_LISTING_SELECT,
  CPU_MODEL_CONFLICT_SELECT,
  CPU_SUMMARY_SELECT,
} from './persistence/cpu.prisma'
import {
  buildCpuListQuery,
  buildCpuModelNameConflictWhere,
  buildCpuOptionsQuery,
  buildMobileCpuListQuery,
  buildMobilePcListingCpuQuery,
} from './persistence/cpu.query'
import type {
  CpuDetailRecord,
  CpuDeleteGuardRecord,
  CpuListResult,
  CpuMobileListResult,
  CpuMobilePcListingResult,
  CpuModelNameConflictInput,
  CpuModelNameConflictRecord,
  CpuOptionsFilters,
  CpuOptionsResult,
  CpuSummaryRecord,
  UpdateCpuData,
} from './cpu.repository.types'
import type {
  CreateCpuInput,
  GetCpusInput,
  MobileGetCpusInput,
  MobilePcListingCpusInput,
} from '../shared/cpu.types'

export class CpuRepository extends PrismaWriteRepository<CpuWriteContext> {
  protected translateWriteError(error: unknown, context: CpuWriteContext): never {
    return translateCpuWriteError(error, context)
  }

  async byIdWithCounts(id: string): Promise<CpuDetailRecord | null> {
    return this.prisma.cpu.findUnique({
      where: { id },
      select: CPU_DETAIL_SELECT,
    })
  }

  async findDeleteGuardById(id: string): Promise<CpuDeleteGuardRecord | null> {
    return this.prisma.cpu.findUnique({
      where: { id },
      select: CPU_DELETE_GUARD_SELECT,
    })
  }

  async listByIds(ids: string[]): Promise<CpuSummaryRecord[]> {
    if (ids.length === 0) return []

    return this.prisma.cpu.findMany({
      where: { id: { in: ids } },
      select: CPU_SUMMARY_SELECT,
    })
  }

  async list(filters: GetCpusInput = {}): Promise<CpuListResult> {
    const query = buildCpuListQuery(filters)

    const [cpus, total] = await Promise.all([
      this.prisma.cpu.findMany({
        where: query.where,
        select: CPU_DETAIL_SELECT,
        orderBy: query.orderBy,
        take: query.pagination.limit,
        skip: query.pagination.offset,
      }),
      this.prisma.cpu.count({ where: query.where }),
    ])

    return {
      cpus,
      pagination: paginationResult(total, query.pagination),
    }
  }

  async listMobileCompatibility(filters: MobileGetCpusInput = {}): Promise<CpuMobileListResult> {
    const query = buildMobileCpuListQuery(filters)

    const [cpus, total] = await Promise.all([
      this.prisma.cpu.findMany({
        where: query.where,
        select: CPU_MOBILE_LIST_SELECT,
        orderBy: query.orderBy,
        take: query.pagination.limit,
        skip: query.pagination.offset,
      }),
      this.prisma.cpu.count({ where: query.where }),
    ])

    return {
      cpus,
      pagination: paginationResult(total, query.pagination),
    }
  }

  async byIdMobileCompatibility(id: string): Promise<CpuMobileListResult['cpus'][number] | null> {
    return this.prisma.cpu.findUnique({
      where: { id },
      select: CPU_MOBILE_LIST_SELECT,
    })
  }

  async pcListingMobileCpuCompatibility(
    filters: MobilePcListingCpusInput,
  ): Promise<CpuMobilePcListingResult> {
    const query = buildMobilePcListingCpuQuery(filters)
    const cpus = await this.prisma.cpu.findMany({
      where: query.where,
      select: CPU_MOBILE_PC_LISTING_SELECT,
      orderBy: query.orderBy,
      take: query.limit,
    })

    return { cpus }
  }

  async options(filters: CpuOptionsFilters = {}): Promise<CpuOptionsResult> {
    const query = buildCpuOptionsQuery(filters)
    const cpus = await this.prisma.cpu.findMany({
      where: query.where,
      select: CPU_SUMMARY_SELECT,
      orderBy: query.orderBy,
      take: query.limit + 1,
      skip: query.offset,
    })

    return {
      cpus: cpus.slice(0, query.limit),
      hasMore: cpus.length > query.limit,
    }
  }

  async findModelNameConflict(
    input: CpuModelNameConflictInput,
  ): Promise<CpuModelNameConflictRecord | null> {
    return this.prisma.cpu.findFirst({
      where: buildCpuModelNameConflictWhere(input),
      select: CPU_MODEL_CONFLICT_SELECT,
    })
  }

  async create(data: CreateCpuInput): Promise<CpuDetailRecord> {
    return this.executeWrite(() => this.prisma.cpu.create({ data, select: CPU_DETAIL_SELECT }), {
      action: 'create',
      modelName: data.modelName,
    })
  }

  async update(id: string, data: UpdateCpuData): Promise<CpuDetailRecord> {
    return this.executeWrite(
      () => this.prisma.cpu.update({ where: { id }, data, select: CPU_DETAIL_SELECT }),
      { action: 'update', modelName: data.modelName },
    )
  }

  async delete(id: string): Promise<void> {
    await this.executeWrite(() => this.prisma.cpu.delete({ where: { id }, select: { id: true } }), {
      action: 'delete',
    })
  }

  async stats(): Promise<{
    total: number
    withListings: number
    withoutListings: number
  }> {
    const [withListings, withoutListings] = await Promise.all([
      this.prisma.cpu.count({ where: { pcListings: { some: {} } } }),
      this.prisma.cpu.count({ where: { pcListings: { none: {} } } }),
    ])

    return {
      total: withListings + withoutListings,
      withListings,
      withoutListings,
    }
  }
}
