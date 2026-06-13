import type { CpuLabelInput } from './cpu.types'

export function getCpuLabel(cpu: CpuLabelInput): string {
  return `${cpu.brand.name} ${cpu.modelName}`
}
