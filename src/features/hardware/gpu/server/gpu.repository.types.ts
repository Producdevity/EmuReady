import type { GetGpuOptionsInput, UpdateGpuInput } from '../shared/gpu.types'
import type {
  GpuDetailRecord,
  GpuMobileListRecord,
  GpuMobilePcListingRecord,
  GpuSummaryRecord,
} from './persistence/gpu.prisma'
import type { PaginationResult } from '@/schemas/pagination'

export type {
  GpuDeleteGuardRecord,
  GpuDetailRecord,
  GpuMobileListRecord,
  GpuMobilePcListingRecord,
  GpuModelNameConflictRecord,
  GpuSummaryRecord,
} from './persistence/gpu.prisma'

export type GpuListResult = {
  gpus: GpuDetailRecord[]
  pagination: PaginationResult
}

export type GpuOptionsResult = {
  gpus: GpuSummaryRecord[]
  hasMore: boolean
}

export type GpuMobileListResult = {
  gpus: GpuMobileListRecord[]
  pagination: PaginationResult
}

export type GpuMobilePcListingResult = {
  gpus: GpuMobilePcListingRecord[]
}

export type GpuOptionsFilters = NonNullable<GetGpuOptionsInput>
export type UpdateGpuData = Omit<UpdateGpuInput, 'id'>

export type GpuModelNameConflictInput = {
  brandId: string
  modelName: string
  excludeId?: string
}
