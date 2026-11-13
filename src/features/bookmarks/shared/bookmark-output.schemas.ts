import { z } from 'zod'
import { PaginationResultSchema } from '@/schemas/pagination'
import { ApprovalStatus } from '@orm'

const NamedEntitySchema = z.object({ id: z.string(), name: z.string() })
const HardwareSchema = z.object({ id: z.string(), modelName: z.string(), brand: NamedEntitySchema })
const ReportSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  status: z.nativeEnum(ApprovalStatus),
  successRate: z.number(),
  _count: z.object({ votes: z.number(), comments: z.number() }),
  author: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      profileImage: z.string().nullable(),
    })
    .nullable(),
  game: z.object({
    id: z.string(),
    title: z.string(),
    system: NamedEntitySchema.extend({ key: z.string().nullable() }),
  }),
  emulator: NamedEntitySchema.extend({ logo: z.string().nullable() }),
  performance: z.object({
    id: z.number(),
    label: z.string(),
    rank: z.number(),
    description: z.string().nullable(),
  }),
})
const BookmarkSchema = z.object({ id: z.string(), createdAt: z.date() })
const HiddenSchema = z.object({ visibility: z.literal('hidden') })

export const ListingBookmarksOutputSchema = z.discriminatedUnion('visibility', [
  HiddenSchema,
  z.object({
    visibility: z.literal('visible'),
    items: z.array(
      BookmarkSchema.extend({ listing: ReportSchema.extend({ device: HardwareSchema }) }),
    ),
    pagination: PaginationResultSchema,
  }),
])
export const PcListingBookmarksOutputSchema = z.discriminatedUnion('visibility', [
  HiddenSchema,
  z.object({
    visibility: z.literal('visible'),
    items: z.array(
      BookmarkSchema.extend({
        pcListing: ReportSchema.extend({ cpu: HardwareSchema, gpu: HardwareSchema.nullable() }),
      }),
    ),
    pagination: PaginationResultSchema,
  }),
])
export const BookmarkCountsOutputSchema = z.discriminatedUnion('visibility', [
  HiddenSchema,
  z.object({
    visibility: z.literal('visible'),
    counts: z.object({ listingBookmarks: z.number(), pcListingBookmarks: z.number() }),
  }),
])
export const BookmarkStatusOutputSchema = z.object({ isBookmarked: z.boolean() })
export const BulkBookmarkStatusOutputSchema = z.object({ statuses: z.record(z.boolean()) })
