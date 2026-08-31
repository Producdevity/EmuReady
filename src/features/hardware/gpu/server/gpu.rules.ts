import { ResourceError } from '@/lib/errors'
import type { GpuDeleteGuardRecord, GpuModelNameConflictRecord } from './gpu.repository.types'

export function assertGpuModelNameAvailable(
  conflict: GpuModelNameConflictRecord | null,
  modelName: string,
): void {
  if (conflict) throw ResourceError.gpu.alreadyExists(modelName)
}

export function assertGpuCanBeDeleted(gpu: GpuDeleteGuardRecord): void {
  const usageCount = gpu._count.pcListings + gpu._count.presets
  if (usageCount > 0) throw ResourceError.gpu.inUse(usageCount)
}
