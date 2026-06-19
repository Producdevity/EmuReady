import type {
  CreateCpuSchema,
  DeleteCpuSchema,
  GetCpuOptionsSchema,
  GetCpusByIdsSchema,
  GetCpusSchema,
  CpuDetailSchema,
  CpuListResponseSchema,
  CpuOptionsResponseSchema,
  CpuStatsSchema,
  CpuSummarySchema,
  CpuSortFieldSchema,
  CpusByIdsResponseSchema,
  MobileGetCpusSchema,
  MobileCpuListItemSchema,
  MobileCpuListResponseSchema,
  MobilePcListingCpusSchema,
  MobilePcListingCpuResponseSchema,
  UpdateCpuSchema,
} from './cpu.schemas'
import type { z } from 'zod'

export type CpuSortField = z.output<typeof CpuSortFieldSchema>
export type GetCpusInput = z.input<typeof GetCpusSchema>
export type GetCpuOptionsInput = z.input<typeof GetCpuOptionsSchema>
export type MobileGetCpusInput = z.input<typeof MobileGetCpusSchema>
export type MobilePcListingCpusInput = z.input<typeof MobilePcListingCpusSchema>
export type CreateCpuInput = z.output<typeof CreateCpuSchema>
export type UpdateCpuInput = z.output<typeof UpdateCpuSchema>
export type DeleteCpuInput = z.output<typeof DeleteCpuSchema>
export type GetCpusByIdsInput = z.output<typeof GetCpusByIdsSchema>
export type CpuSummary = z.output<typeof CpuSummarySchema>
export type CpuLabelInput = Pick<CpuSummary, 'modelName'> & {
  brand: Pick<CpuSummary['brand'], 'name'>
}
export type CpuDetail = z.output<typeof CpuDetailSchema>
export type CpuListResponse = z.output<typeof CpuListResponseSchema>
export type CpuOptionsResponse = z.output<typeof CpuOptionsResponseSchema>
export type CpusByIdsResponse = z.output<typeof CpusByIdsResponseSchema>
export type CpuStats = z.output<typeof CpuStatsSchema>
export type MobileCpuListItem = z.output<typeof MobileCpuListItemSchema>
export type MobileCpuListResponse = z.output<typeof MobileCpuListResponseSchema>
export type MobilePcListingCpuResponse = z.output<typeof MobilePcListingCpuResponseSchema>
