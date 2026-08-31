import type { GetCpuOptionsInput, UpdateCpuInput } from '../shared/cpu.types'
import type {
  CpuDetailRecord,
  CpuMobileListRecord,
  CpuMobilePcListingRecord,
  CpuSummaryRecord,
} from './persistence/cpu.prisma'
import type { PaginationResult } from '@/schemas/pagination'

export type {
  CpuDeleteGuardRecord,
  CpuDetailRecord,
  CpuMobileListRecord,
  CpuMobilePcListingRecord,
  CpuModelNameConflictRecord,
  CpuSummaryRecord,
} from './persistence/cpu.prisma'

export type CpuListResult = {
  cpus: CpuDetailRecord[]
  pagination: PaginationResult
}

export type CpuOptionsResult = {
  cpus: CpuSummaryRecord[]
  hasMore: boolean
}

export type CpuMobileListResult = {
  cpus: CpuMobileListRecord[]
  pagination: PaginationResult
}

export type CpuMobilePcListingResult = {
  cpus: CpuMobilePcListingRecord[]
}

export type CpuOptionsFilters = NonNullable<GetCpuOptionsInput>
export type UpdateCpuData = Omit<UpdateCpuInput, 'id'>

export type CpuModelNameConflictInput = {
  brandId: string
  modelName: string
  excludeId?: string
}
