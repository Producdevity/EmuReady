import { z } from 'zod'

export const GetPerformanceScaleByIdSchema = z.object({ id: z.number() })

export const CreatePerformanceScaleSchema = z.object({
  label: z.string().min(1),
  rank: z.number(),
  description: z.string().optional(),
})

export const UpdatePerformanceScaleSchema = z.object({
  id: z.number(),
  label: z.string().min(1),
  rank: z.number(),
  description: z.string().optional(),
})

export const DeletePerformanceScaleSchema = z.object({ id: z.number() })
