import { getGpuLabel } from '../../shared/gpu-format'
import type { GpuSummary } from '../../shared/gpu.types'
import type { Option } from '@/components/ui/form/async-multi-select/AsyncMultiSelect'

export function toGpuSelectOption(gpu: GpuSummary): Option {
  return {
    id: gpu.id,
    name: getGpuLabel(gpu),
    badgeName: gpu.modelName,
  }
}
