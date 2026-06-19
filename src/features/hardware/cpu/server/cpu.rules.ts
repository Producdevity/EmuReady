import { ResourceError } from '@/lib/errors'
import type { CpuDeleteGuardRecord, CpuModelNameConflictRecord } from './cpu.repository.types'

export function assertCpuModelNameAvailable(
  conflict: CpuModelNameConflictRecord | null,
  modelName: string,
): void {
  if (conflict) throw ResourceError.cpu.alreadyExists(modelName)
}

export function assertCpuCanBeDeleted(cpu: CpuDeleteGuardRecord): void {
  const usageCount = cpu._count.pcListings + cpu._count.presets
  if (usageCount > 0) throw ResourceError.cpu.inUse(usageCount)
}
