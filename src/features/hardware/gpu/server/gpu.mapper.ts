import { GpuDetailSchema, GpuSummarySchema } from '../shared/gpu.schemas'
import type { GpuDetailRecord, GpuSummaryRecord } from './gpu.repository.types'
import type { GpuDetail, GpuSummary } from '../shared/gpu.types'

export function toGpuSummaryDto(gpu: GpuSummaryRecord): GpuSummary {
  return GpuSummarySchema.parse({
    id: gpu.id,
    modelName: gpu.modelName,
    brand: {
      id: gpu.brand.id,
      name: gpu.brand.name,
    },
  })
}

export function toGpuDetailDto(gpu: GpuDetailRecord): GpuDetail {
  return GpuDetailSchema.parse({
    id: gpu.id,
    modelName: gpu.modelName,
    brand: {
      id: gpu.brand.id,
      name: gpu.brand.name,
    },
    pcListingCount: gpu._count.pcListings,
  })
}
