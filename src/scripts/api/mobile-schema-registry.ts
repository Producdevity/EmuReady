import { z } from 'zod'
import * as cpuSchemas from '@/features/hardware/cpu/shared/cpu.schemas'
import * as gpuSchemas from '@/features/hardware/gpu/shared/gpu.schemas'
import * as commonSchemas from '@/schemas/common'
import * as mobileSchemas from '@/schemas/mobile'
import * as mobileAuthSchemas from '@/schemas/mobileAuth'
import * as paginationSchemas from '@/schemas/pagination'

const schemaModules: Record<string, unknown>[] = [
  commonSchemas,
  cpuSchemas,
  gpuSchemas,
  mobileSchemas,
  mobileAuthSchemas,
  paginationSchemas,
]

export function getMobileApiSchema(schemaName: string): z.ZodTypeAny | null {
  for (const schemaModule of schemaModules) {
    const schema = schemaModule[schemaName]
    if (schema instanceof z.ZodType) return schema
  }

  return null
}
