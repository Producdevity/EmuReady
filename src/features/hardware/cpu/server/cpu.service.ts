import { ResourceError } from '@/lib/errors'
import { createMutationSuccess, type MutationSuccess } from '@/schemas/common'
import { type Actor } from '@/server/auth/actor'
import { type PrismaRepositoryClient } from '@/server/persistence/prisma.repository'
import { normalizeWhitespace } from '@/utils/text'
import { toCpuDetailDto, toCpuSummaryDto } from './cpu.mapper'
import { assertCanManageCpu, assertCanViewCpuStats } from './cpu.policy'
import { CpuRepository } from './cpu.repository'
import { assertCpuCanBeDeleted, assertCpuModelNameAvailable } from './cpu.rules'
import {
  CpuListResponseSchema,
  CpuOptionsResponseSchema,
  CpuStatsSchema,
  CpusByIdsResponseSchema,
  MobileCpuListItemSchema,
  MobileCpuListResponseSchema,
  MobilePcListingCpuResponseSchema,
} from '../shared/cpu.schemas'
import type {
  CreateCpuInput,
  DeleteCpuInput,
  GetCpuOptionsInput,
  GetCpusByIdsInput,
  GetCpusInput,
  CpuDetail,
  CpuListResponse,
  CpuOptionsResponse,
  CpuStats,
  CpusByIdsResponse,
  MobileGetCpusInput,
  MobileCpuListItem,
  MobileCpuListResponse,
  MobilePcListingCpusInput,
  MobilePcListingCpuResponse,
  UpdateCpuInput,
} from '../shared/cpu.types'

export class CpuService {
  constructor(private readonly repository: CpuRepository) {}

  async list(input: GetCpusInput = {}): Promise<CpuListResponse> {
    const result = await this.repository.list(input ?? {})

    return CpuListResponseSchema.parse({
      cpus: result.cpus.map((cpu) => toCpuDetailDto(cpu)),
      pagination: result.pagination,
    })
  }

  async listMobileCompatibility(input: MobileGetCpusInput = {}): Promise<MobileCpuListResponse> {
    const result = await this.repository.listMobileCompatibility(input ?? {})
    return MobileCpuListResponseSchema.parse(result)
  }

  async byIdMobileCompatibility(id: string): Promise<MobileCpuListItem> {
    const cpu = await this.repository.byIdMobileCompatibility(id)
    if (!cpu) throw ResourceError.cpu.notFound()

    return MobileCpuListItemSchema.parse(cpu)
  }

  async pcListingMobileCpuCompatibility(
    input: MobilePcListingCpusInput,
  ): Promise<MobilePcListingCpuResponse> {
    const result = await this.repository.pcListingMobileCpuCompatibility(input)
    return MobilePcListingCpuResponseSchema.parse(result)
  }

  async options(input: GetCpuOptionsInput = {}): Promise<CpuOptionsResponse> {
    const result = await this.repository.options(input ?? {})

    return CpuOptionsResponseSchema.parse({
      cpus: result.cpus.map((cpu) => toCpuSummaryDto(cpu)),
      hasMore: result.hasMore,
    })
  }

  async byId(id: string): Promise<CpuDetail> {
    const cpu = await this.repository.byIdWithCounts(id)
    if (!cpu) throw ResourceError.cpu.notFound()

    return toCpuDetailDto(cpu)
  }

  async listByIds(input: GetCpusByIdsInput): Promise<CpusByIdsResponse> {
    const cpus = await this.repository.listByIds(input.ids)
    return CpusByIdsResponseSchema.parse(cpus.map((cpu) => toCpuSummaryDto(cpu)))
  }

  async create(actor: Actor, input: CreateCpuInput): Promise<CpuDetail> {
    assertCanManageCpu(actor)
    const modelName = normalizeWhitespace(input.modelName)
    const conflict = await this.repository.findModelNameConflict({
      brandId: input.brandId,
      modelName,
    })
    assertCpuModelNameAvailable(conflict, modelName)

    const cpu = await this.repository.create({
      brandId: input.brandId,
      modelName,
    })

    return toCpuDetailDto(cpu)
  }

  async update(actor: Actor, input: UpdateCpuInput): Promise<CpuDetail> {
    assertCanManageCpu(actor)
    const modelName = normalizeWhitespace(input.modelName)
    const conflict = await this.repository.findModelNameConflict({
      brandId: input.brandId,
      modelName,
      excludeId: input.id,
    })
    assertCpuModelNameAvailable(conflict, modelName)

    const cpu = await this.repository.update(input.id, {
      brandId: input.brandId,
      modelName,
    })

    return toCpuDetailDto(cpu)
  }

  async delete(actor: Actor, input: DeleteCpuInput): Promise<MutationSuccess> {
    assertCanManageCpu(actor)

    const cpu = await this.repository.findDeleteGuardById(input.id)
    if (!cpu) throw ResourceError.cpu.notFound()
    assertCpuCanBeDeleted(cpu)

    await this.repository.delete(input.id)
    return createMutationSuccess()
  }

  async stats(actor: Actor): Promise<CpuStats> {
    assertCanViewCpuStats(actor)
    return CpuStatsSchema.parse(await this.repository.stats())
  }
}

export function createCpuService(prisma: PrismaRepositoryClient): CpuService {
  return new CpuService(new CpuRepository(prisma))
}
