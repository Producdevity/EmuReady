import { AppError } from '@/lib/errors'
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
} from '@/schemas/bookmark'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { BookmarkRepository } from '@/server/repositories/bookmark.repository'
import { isUserBanned } from '@/server/utils/query-builders'

export const bookmarksRouter = createTRPCRouter({
  bookmark: protectedProcedure.input(BookmarkListingSchema).mutation(async ({ ctx, input }) => {
    if (await isUserBanned(ctx.prisma, ctx.session.user.id)) {
      return AppError.shadowBanned()
    }
    const repo = new BookmarkRepository(ctx.prisma)
    await repo.bookmark(ctx.session.user.id, input.listingId)
    return { success: true }
  }),

  unbookmark: protectedProcedure.input(UnbookmarkListingSchema).mutation(async ({ ctx, input }) => {
    const repo = new BookmarkRepository(ctx.prisma)
    await repo.unbookmark(ctx.session.user.id, input.listingId)
    return { success: true }
  }),

  isBookmarked: publicProcedure.input(IsListingBookmarkedSchema).query(async ({ ctx, input }) => {
    if (!ctx.session?.user?.id) return { isBookmarked: false }
    const repo = new BookmarkRepository(ctx.prisma)
    return { isBookmarked: await repo.isBookmarked(ctx.session.user.id, input.listingId) }
  }),

  getBulkListingBookmarkStatuses: publicProcedure
    .input(GetBulkListingBookmarkStatusesSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) return { statuses: {} }
      const repo = new BookmarkRepository(ctx.prisma)
      const statuses = await repo.getBulkBookmarkStatuses(ctx.session.user.id, input.listingIds)
      return { statuses }
    }),

  getListingBookmarks: publicProcedure
    .input(GetListingBookmarksSchema)
    .query(async ({ ctx, input }) => {
      const repo = new BookmarkRepository(ctx.prisma)
      return repo.list(
        input.userId,
        input.page,
        input.limit,
        {
          requestingUserId: ctx.session?.user?.id,
          requestingUserRole: ctx.session?.user?.role,
        },
        input.search,
      )
    }),

  pcBookmark: protectedProcedure.input(BookmarkPcListingSchema).mutation(async ({ ctx, input }) => {
    if (await isUserBanned(ctx.prisma, ctx.session.user.id)) {
      return AppError.shadowBanned()
    }
    const repo = new BookmarkRepository(ctx.prisma)
    await repo.pcBookmark(ctx.session.user.id, input.pcListingId)
    return { success: true }
  }),

  pcUnbookmark: protectedProcedure
    .input(UnbookmarkPcListingSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new BookmarkRepository(ctx.prisma)
      await repo.pcUnbookmark(ctx.session.user.id, input.pcListingId)
      return { success: true }
    }),

  isPcBookmarked: publicProcedure
    .input(IsPcListingBookmarkedSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) return { isBookmarked: false }
      const repo = new BookmarkRepository(ctx.prisma)
      return { isBookmarked: await repo.isPcBookmarked(ctx.session.user.id, input.pcListingId) }
    }),

  getBulkPcListingBookmarkStatuses: publicProcedure
    .input(GetBulkPcListingBookmarkStatusesSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) return { statuses: {} }
      const repo = new BookmarkRepository(ctx.prisma)
      const statuses = await repo.getBulkPcBookmarkStatuses(ctx.session.user.id, input.pcListingIds)
      return { statuses }
    }),

  getPcListingBookmarks: publicProcedure
    .input(GetPcListingBookmarksSchema)
    .query(async ({ ctx, input }) => {
      const repo = new BookmarkRepository(ctx.prisma)
      return repo.pcList(
        input.userId,
        input.page,
        input.limit,
        {
          requestingUserId: ctx.session?.user?.id,
          requestingUserRole: ctx.session?.user?.role,
        },
        input.search,
      )
    }),

  getCounts: publicProcedure.input(GetBookmarkCountsSchema).query(async ({ ctx, input }) => {
    const repo = new BookmarkRepository(ctx.prisma)
    return repo.counts(input.userId, {
      requestingUserId: ctx.session?.user?.id,
      requestingUserRole: ctx.session?.user?.role,
    })
  }),
})
