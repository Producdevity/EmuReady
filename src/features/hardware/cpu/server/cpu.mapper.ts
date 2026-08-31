import { CpuDetailSchema, CpuSummarySchema } from '../shared/cpu.schemas'
import type { CpuDetailRecord, CpuSummaryRecord } from './cpu.repository.types'
import type { CpuDetail, CpuSummary } from '../shared/cpu.types'

export function toCpuSummaryDto(cpu: CpuSummaryRecord): CpuSummary {
  return CpuSummarySchema.parse({
    id: cpu.id,
    modelName: cpu.modelName,
    brand: {
      id: cpu.brand.id,
      name: cpu.brand.name,
    },
  })
}

export function toCpuDetailDto(cpu: CpuDetailRecord): CpuDetail {
  return CpuDetailSchema.parse({
    id: cpu.id,
    modelName: cpu.modelName,
    brand: {
      id: cpu.brand.id,
      name: cpu.brand.name,
    },
    pcListingCount: cpu._count.pcListings,
  })
}
