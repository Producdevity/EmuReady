import { BookmarkRepository } from '@/features/bookmarks/server/bookmark.repository'
import {
  BookmarkListingSchema,
  BookmarkPcListingSchema,
  GetBookmarkCountsSchema,
  GetBulkListingBookmarkStatusesSchema,
  GetBulkPcListingBookmarkStatusesSchema,
  GetListingBookmarksSchema,
  GetPcListingBookmarksSchema,
  IsListingBookmarkedSchema,
  IsPcListingBookmarkedSchema,
  UnbookmarkListingSchema,
  UnbookmarkPcListingSchema,
} from '@/features/bookmarks/shared/bookmark.schemas'
import { AppError } from '@/lib/errors'
import { MutationSuccessSchema } from '@/schemas/common'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { isUserBanned } from '@/server/utils/query-builders'
import {
  BookmarkCountsOutputSchema,
  BookmarkStatusOutputSchema,
  BulkBookmarkStatusOutputSchema,
  ListingBookmarksOutputSchema,
  PcListingBookmarksOutputSchema,
} from '../shared/bookmark-output.schemas'

export const bookmarksRouter = createTRPCRouter({
  bookmark: protectedProcedure
    .input(BookmarkListingSchema)
    .output(MutationSuccessSchema)
    .mutation(async ({ ctx, input }) => {
      if (await isUserBanned(ctx.prisma, ctx.session.user.id)) {
        return AppError.shadowBanned()
      }
      const repo = new BookmarkRepository(ctx.prisma)
      await repo.bookmark(ctx.session.user.id, input.listingId)
      return { success: true }
    }),

  unbookmark: protectedProcedure
    .input(UnbookmarkListingSchema)
    .output(MutationSuccessSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new BookmarkRepository(ctx.prisma)
      await repo.unbookmark(ctx.session.user.id, input.listingId)
      return { success: true }
    }),

  isBookmarked: publicProcedure
    .input(IsListingBookmarkedSchema)
    .output(BookmarkStatusOutputSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) return { isBookmarked: false }
      const repo = new BookmarkRepository(ctx.prisma)
      return { isBookmarked: await repo.isBookmarked(ctx.session.user.id, input.listingId) }
    }),

  getBulkListingBookmarkStatuses: publicProcedure
    .input(GetBulkListingBookmarkStatusesSchema)
    .output(BulkBookmarkStatusOutputSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) return { statuses: {} }
      const repo = new BookmarkRepository(ctx.prisma)
      const statuses = await repo.getBulkBookmarkStatuses(ctx.session.user.id, input.listingIds)
      return { statuses }
    }),

  getListingBookmarks: publicProcedure
    .input(GetListingBookmarksSchema)
    .output(ListingBookmarksOutputSchema)
    .query(async ({ ctx, input }) => {
      const repo = new BookmarkRepository(ctx.prisma)
      return repo.list(input, {
        requestingUserId: ctx.session?.user?.id,
        requestingUserRole: ctx.session?.user?.role,
      })
    }),

  pcBookmark: protectedProcedure
    .input(BookmarkPcListingSchema)
    .output(MutationSuccessSchema)
    .mutation(async ({ ctx, input }) => {
      if (await isUserBanned(ctx.prisma, ctx.session.user.id)) {
        return AppError.shadowBanned()
      }
      const repo = new BookmarkRepository(ctx.prisma)
      await repo.pcBookmark(ctx.session.user.id, input.pcListingId)
      return { success: true }
    }),

  pcUnbookmark: protectedProcedure
    .input(UnbookmarkPcListingSchema)
    .output(MutationSuccessSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new BookmarkRepository(ctx.prisma)
      await repo.pcUnbookmark(ctx.session.user.id, input.pcListingId)
      return { success: true }
    }),

  isPcBookmarked: publicProcedure
    .input(IsPcListingBookmarkedSchema)
    .output(BookmarkStatusOutputSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) return { isBookmarked: false }
      const repo = new BookmarkRepository(ctx.prisma)
      return { isBookmarked: await repo.isPcBookmarked(ctx.session.user.id, input.pcListingId) }
    }),

  getBulkPcListingBookmarkStatuses: publicProcedure
    .input(GetBulkPcListingBookmarkStatusesSchema)
    .output(BulkBookmarkStatusOutputSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) return { statuses: {} }
      const repo = new BookmarkRepository(ctx.prisma)
      const statuses = await repo.getBulkPcBookmarkStatuses(ctx.session.user.id, input.pcListingIds)
      return { statuses }
    }),

  getPcListingBookmarks: publicProcedure
    .input(GetPcListingBookmarksSchema)
    .output(PcListingBookmarksOutputSchema)
    .query(async ({ ctx, input }) => {
      const repo = new BookmarkRepository(ctx.prisma)
      return repo.pcList(input, {
        requestingUserId: ctx.session?.user?.id,
        requestingUserRole: ctx.session?.user?.role,
      })
    }),

  getCounts: publicProcedure
    .input(GetBookmarkCountsSchema)
    .output(BookmarkCountsOutputSchema)
    .query(async ({ ctx, input }) => {
      const repo = new BookmarkRepository(ctx.prisma)
      return repo.counts(input.userId, {
        requestingUserId: ctx.session?.user?.id,
        requestingUserRole: ctx.session?.user?.role,
      })
    }),
})
