import type { GpuLabelInput } from './gpu.types'

export function getGpuLabel(gpu: GpuLabelInput): string {
  return `${gpu.brand.name} ${gpu.modelName}`
}
