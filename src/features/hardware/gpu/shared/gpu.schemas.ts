import { z } from 'zod'
import { LOOKUP_PAGINATION, PAGINATION } from '@/data/constants'
import { SortDirectionSchema } from '@/schemas/common'
import {
  LookupPaginationInputSchema,
  PaginationInputSchema,
  PaginationResultSchema,
} from '@/schemas/pagination'

export const GpuSortFieldSchema = z.enum(['brand', 'modelName', 'pcListings'])

export const GetGpusSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
    sortField: GpuSortFieldSchema.optional(),
    sortDirection: SortDirectionSchema.optional(),
  })
  .merge(PaginationInputSchema)
  .optional()

export const GetGpuOptionsSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
  })
  .merge(LookupPaginationInputSchema)
  .optional()

// Mobile/public compatibility contract for the existing GPU catalog route.
export const MobileGetGpusSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
    limit: z.number().default(PAGINATION.DEFAULT_LIMIT),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: GpuSortFieldSchema.optional(),
    sortDirection: SortDirectionSchema.optional(),
  })
  .optional()

export const MobilePcListingGpusSchema = z.object({
  search: z.string().optional(),
  brandId: z.string().uuid().optional(),
  limit: z.number().min(1).max(PAGINATION.MAX_LIMIT).default(LOOKUP_PAGINATION.DEFAULT_LIMIT),
})

export const GetGpuByIdSchema = z.object({ id: z.string().uuid() })
export const GetGpusByIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(LOOKUP_PAGINATION.MAX_LIMIT),
})

export const CreateGpuSchema = z.object({
  brandId: z.string().uuid(),
  modelName: z.string().trim().min(1),
})

export const UpdateGpuSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  modelName: z.string().trim().min(1),
})

export const DeleteGpuSchema = z.object({ id: z.string().uuid() })

export const GpuBrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

export const GpuSummarySchema = z.object({
  id: z.string().uuid(),
  modelName: z.string(),
  brand: GpuBrandSchema,
})

export const GpuDetailSchema = GpuSummarySchema.extend({
  pcListingCount: z.number().int().min(0),
})

export const GpuListResponseSchema = z.object({
  gpus: z.array(GpuDetailSchema),
  pagination: PaginationResultSchema,
})

export const GpuOptionsResponseSchema = z.object({
  gpus: z.array(GpuSummarySchema),
  hasMore: z.boolean(),
})

export const MobileGpuListItemSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  modelName: z.string(),
  createdAt: z.date(),
  brand: GpuBrandSchema,
  _count: z.object({ pcListings: z.number().int().min(0) }),
})

export const MobileGpuListResponseSchema = z.object({
  gpus: z.array(MobileGpuListItemSchema),
  pagination: PaginationResultSchema,
})

export const MobilePcListingGpuSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  modelName: z.string(),
  createdAt: z.date(),
  brand: GpuBrandSchema,
})

export const MobilePcListingGpuResponseSchema = z.object({
  gpus: z.array(MobilePcListingGpuSchema),
})

export const GpusByIdsResponseSchema = z.array(GpuSummarySchema)

export const GpuStatsSchema = z.object({
  total: z.number().int().min(0),
  withListings: z.number().int().min(0),
  withoutListings: z.number().int().min(0),
})
