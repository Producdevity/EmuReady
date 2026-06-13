import { z } from 'zod'
import { LOOKUP_PAGINATION, PAGINATION } from '@/data/constants'
import { SortDirectionSchema } from '@/schemas/common'
import {
  LookupPaginationInputSchema,
  PaginationInputSchema,
  PaginationResultSchema,
} from '@/schemas/pagination'

export const CpuSortFieldSchema = z.enum(['brand', 'modelName', 'pcListings'])

export const GetCpusSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
    sortField: CpuSortFieldSchema.optional(),
    sortDirection: SortDirectionSchema.optional(),
  })
  .merge(PaginationInputSchema)
  .optional()

export const GetCpuOptionsSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
  })
  .merge(LookupPaginationInputSchema)
  .optional()

// Mobile/public compatibility contract for the existing CPU catalog route.
export const MobileGetCpusSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
    limit: z.number().default(PAGINATION.DEFAULT_LIMIT),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: CpuSortFieldSchema.optional(),
    sortDirection: SortDirectionSchema.optional(),
  })
  .optional()

export const MobilePcListingCpusSchema = z.object({
  search: z.string().optional(),
  brandId: z.string().uuid().optional(),
  limit: z.number().min(1).max(PAGINATION.MAX_LIMIT).default(LOOKUP_PAGINATION.DEFAULT_LIMIT),
})

export const GetCpuByIdSchema = z.object({ id: z.string().uuid() })
export const GetCpusByIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(LOOKUP_PAGINATION.MAX_LIMIT),
})

export const CreateCpuSchema = z.object({
  brandId: z.string().uuid(),
  modelName: z.string().trim().min(1),
})

export const UpdateCpuSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  modelName: z.string().trim().min(1),
})

export const DeleteCpuSchema = z.object({ id: z.string().uuid() })

export const CpuBrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

export const CpuSummarySchema = z.object({
  id: z.string().uuid(),
  modelName: z.string(),
  brand: CpuBrandSchema,
})

export const CpuDetailSchema = CpuSummarySchema.extend({
  pcListingCount: z.number().int().min(0),
})

export const CpuListResponseSchema = z.object({
  cpus: z.array(CpuDetailSchema),
  pagination: PaginationResultSchema,
})

export const CpuOptionsResponseSchema = z.object({
  cpus: z.array(CpuSummarySchema),
  hasMore: z.boolean(),
})

export const MobileCpuListItemSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  modelName: z.string(),
  createdAt: z.date(),
  brand: CpuBrandSchema,
  _count: z.object({ pcListings: z.number().int().min(0) }),
})

export const MobileCpuListResponseSchema = z.object({
  cpus: z.array(MobileCpuListItemSchema),
  pagination: PaginationResultSchema,
})

export const MobilePcListingCpuSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  modelName: z.string(),
  createdAt: z.date(),
  brand: CpuBrandSchema,
})

export const MobilePcListingCpuResponseSchema = z.object({
  cpus: z.array(MobilePcListingCpuSchema),
})

export const CpusByIdsResponseSchema = z.array(CpuSummarySchema)

export const CpuStatsSchema = z.object({
  total: z.number().int().min(0),
  withListings: z.number().int().min(0),
  withoutListings: z.number().int().min(0),
})
