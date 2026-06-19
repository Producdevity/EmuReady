import { ResourceError } from '@/lib/errors'
import { createMutationSuccess, type MutationSuccess } from '@/schemas/common'
import { type Actor } from '@/server/auth/actor'
import { type PrismaRepositoryClient } from '@/server/persistence/prisma.repository'
import { normalizeWhitespace } from '@/utils/text'
import { toGpuDetailDto, toGpuSummaryDto } from './gpu.mapper'
import { assertCanManageGpu, assertCanViewGpuStats } from './gpu.policy'
import { GpuRepository } from './gpu.repository'
import { assertGpuCanBeDeleted, assertGpuModelNameAvailable } from './gpu.rules'
import {
  GpuListResponseSchema,
  GpuOptionsResponseSchema,
  GpuStatsSchema,
  GpusByIdsResponseSchema,
  MobileGpuListItemSchema,
  MobileGpuListResponseSchema,
  MobilePcListingGpuResponseSchema,
} from '../shared/gpu.schemas'
import type {
  CreateGpuInput,
  DeleteGpuInput,
  GetGpuOptionsInput,
  GetGpusByIdsInput,
  GetGpusInput,
  GpuDetail,
  GpuListResponse,
  GpuOptionsResponse,
  GpuStats,
  GpusByIdsResponse,
  MobileGetGpusInput,
  MobileGpuListItem,
  MobileGpuListResponse,
  MobilePcListingGpusInput,
  MobilePcListingGpuResponse,
  UpdateGpuInput,
} from '../shared/gpu.types'

export class GpuService {
  constructor(private readonly repository: GpuRepository) {}

  async list(input: GetGpusInput = {}): Promise<GpuListResponse> {
    const result = await this.repository.list(input ?? {})

    return GpuListResponseSchema.parse({
      gpus: result.gpus.map((gpu) => toGpuDetailDto(gpu)),
      pagination: result.pagination,
    })
  }

  async listMobileCompatibility(input: MobileGetGpusInput = {}): Promise<MobileGpuListResponse> {
    const result = await this.repository.listMobileCompatibility(input ?? {})
    return MobileGpuListResponseSchema.parse(result)
  }

  async byIdMobileCompatibility(id: string): Promise<MobileGpuListItem> {
    const gpu = await this.repository.byIdMobileCompatibility(id)
    if (!gpu) throw ResourceError.gpu.notFound()

    return MobileGpuListItemSchema.parse(gpu)
  }

  async pcListingMobileGpuCompatibility(
    input: MobilePcListingGpusInput,
  ): Promise<MobilePcListingGpuResponse> {
    const result = await this.repository.pcListingMobileGpuCompatibility(input)
    return MobilePcListingGpuResponseSchema.parse(result)
  }

  async options(input: GetGpuOptionsInput = {}): Promise<GpuOptionsResponse> {
    const result = await this.repository.options(input ?? {})

    return GpuOptionsResponseSchema.parse({
      gpus: result.gpus.map((gpu) => toGpuSummaryDto(gpu)),
      hasMore: result.hasMore,
    })
  }

  async byId(id: string): Promise<GpuDetail> {
    const gpu = await this.repository.byIdWithCounts(id)
    if (!gpu) throw ResourceError.gpu.notFound()

    return toGpuDetailDto(gpu)
  }

  async listByIds(input: GetGpusByIdsInput): Promise<GpusByIdsResponse> {
    const gpus = await this.repository.listByIds(input.ids)
    return GpusByIdsResponseSchema.parse(gpus.map((gpu) => toGpuSummaryDto(gpu)))
  }

  async create(actor: Actor, input: CreateGpuInput): Promise<GpuDetail> {
    assertCanManageGpu(actor)
    const modelName = normalizeWhitespace(input.modelName)
    const conflict = await this.repository.findModelNameConflict({
      brandId: input.brandId,
      modelName,
    })
    assertGpuModelNameAvailable(conflict, modelName)

    const gpu = await this.repository.create({
      brandId: input.brandId,
      modelName,
    })

    return toGpuDetailDto(gpu)
  }

  async update(actor: Actor, input: UpdateGpuInput): Promise<GpuDetail> {
    assertCanManageGpu(actor)
    const modelName = normalizeWhitespace(input.modelName)
    const conflict = await this.repository.findModelNameConflict({
      brandId: input.brandId,
      modelName,
      excludeId: input.id,
    })
    assertGpuModelNameAvailable(conflict, modelName)

    const gpu = await this.repository.update(input.id, {
      brandId: input.brandId,
      modelName,
    })

    return toGpuDetailDto(gpu)
  }

  async delete(actor: Actor, input: DeleteGpuInput): Promise<MutationSuccess> {
    assertCanManageGpu(actor)

    const gpu = await this.repository.findDeleteGuardById(input.id)
    if (!gpu) throw ResourceError.gpu.notFound()
    assertGpuCanBeDeleted(gpu)

    await this.repository.delete(input.id)
    return createMutationSuccess()
  }

  async stats(actor: Actor): Promise<GpuStats> {
    assertCanViewGpuStats(actor)
    return GpuStatsSchema.parse(await this.repository.stats())
  }
}

export function createGpuService(prisma: PrismaRepositoryClient): GpuService {
  return new GpuService(new GpuRepository(prisma))
}
