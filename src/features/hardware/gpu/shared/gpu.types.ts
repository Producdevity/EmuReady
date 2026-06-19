import type {
  CreateGpuSchema,
  DeleteGpuSchema,
  GetGpuOptionsSchema,
  GetGpusByIdsSchema,
  GetGpusSchema,
  GpuDetailSchema,
  GpuListResponseSchema,
  GpuOptionsResponseSchema,
  GpuStatsSchema,
  GpuSummarySchema,
  GpuSortFieldSchema,
  GpusByIdsResponseSchema,
  MobileGetGpusSchema,
  MobileGpuListItemSchema,
  MobileGpuListResponseSchema,
  MobilePcListingGpusSchema,
  MobilePcListingGpuResponseSchema,
  UpdateGpuSchema,
} from './gpu.schemas'
import type { z } from 'zod'

export type GpuSortField = z.output<typeof GpuSortFieldSchema>
export type GetGpusInput = z.input<typeof GetGpusSchema>
export type GetGpuOptionsInput = z.input<typeof GetGpuOptionsSchema>
export type MobileGetGpusInput = z.input<typeof MobileGetGpusSchema>
export type MobilePcListingGpusInput = z.input<typeof MobilePcListingGpusSchema>
export type CreateGpuInput = z.output<typeof CreateGpuSchema>
export type UpdateGpuInput = z.output<typeof UpdateGpuSchema>
export type DeleteGpuInput = z.output<typeof DeleteGpuSchema>
export type GetGpusByIdsInput = z.output<typeof GetGpusByIdsSchema>
export type GpuSummary = z.output<typeof GpuSummarySchema>
export type GpuLabelInput = Pick<GpuSummary, 'modelName'> & {
  brand: Pick<GpuSummary['brand'], 'name'>
}
export type GpuDetail = z.output<typeof GpuDetailSchema>
export type GpuListResponse = z.output<typeof GpuListResponseSchema>
export type GpuOptionsResponse = z.output<typeof GpuOptionsResponseSchema>
export type GpusByIdsResponse = z.output<typeof GpusByIdsResponseSchema>
export type GpuStats = z.output<typeof GpuStatsSchema>
export type MobileGpuListItem = z.output<typeof MobileGpuListItemSchema>
export type MobileGpuListResponse = z.output<typeof MobileGpuListResponseSchema>
export type MobilePcListingGpuResponse = z.output<typeof MobilePcListingGpuResponseSchema>
