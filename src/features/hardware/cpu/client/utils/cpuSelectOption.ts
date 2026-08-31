import { getCpuLabel } from '../../shared/cpu-format'
import type { CpuSummary } from '../../shared/cpu.types'
import type { Option } from '@/components/ui/form/async-multi-select/AsyncMultiSelect'

export function toCpuSelectOption(cpu: CpuSummary): Option {
  return {
    id: cpu.id,
    name: getCpuLabel(cpu),
    badgeName: cpu.modelName,
  }
}
