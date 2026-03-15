import { z } from 'zod'
import { PAGINATION } from '@/data/constants'

const listingIdSchema = z.object({
  listingId: z.string().uuid(),
})

const pcListingIdSchema = z.object({
  pcListingId: z.string().uuid(),
})

const bookmarkListSchema = z.object({
  userId: z.string().uuid(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  search: z.string().max(100).optional(),
})

export const BookmarkListingSchema = listingIdSchema
export const UnbookmarkListingSchema = listingIdSchema
export const IsListingBookmarkedSchema = listingIdSchema

export const GetBulkListingBookmarkStatusesSchema = z.object({
  listingIds: z.array(z.string().uuid()).min(1).max(50),
})

export const GetListingBookmarksSchema = bookmarkListSchema

export const BookmarkPcListingSchema = pcListingIdSchema
export const UnbookmarkPcListingSchema = pcListingIdSchema
export const IsPcListingBookmarkedSchema = pcListingIdSchema

export const GetBulkPcListingBookmarkStatusesSchema = z.object({
  pcListingIds: z.array(z.string().uuid()).min(1).max(50),
})

export const GetPcListingBookmarksSchema = bookmarkListSchema

export const GetBookmarkCountsSchema = z.object({
  userId: z.string().uuid(),
})
