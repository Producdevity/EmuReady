import { type z } from 'zod'
import {
  type GetListingBookmarksSchema,
  type GetPcListingBookmarksSchema,
} from '@/features/bookmarks/shared/bookmark.schemas'
import { ResourceError } from '@/lib/errors'
import { BaseRepository } from '@/server/repositories/base.repository'
import { hiddenList, visibleList, hiddenCounts, visibleCounts } from '@/server/repositories/types'
import { paginate, calculateOffset } from '@/server/utils/pagination'
import { ApprovalStatus } from '@orm/client'
import {
  buildListingBookmarkQuery,
  buildPcListingBookmarkQuery,
} from './persistence/bookmark-queries'
import { bookmarkSelects } from './persistence/bookmark.selects'
import type {
  VisibilityContext,
  VisibilityGatedList,
  VisibilityGatedCounts,
} from '@/server/repositories/types'
import type { Prisma } from '@orm/client'

type ListingBookmarkItem = Prisma.ListingBookmarkGetPayload<{
  select: typeof bookmarkSelects.listingBookmark
}>
type PcListingBookmarkItem = Prisma.PcListingBookmarkGetPayload<{
  select: typeof bookmarkSelects.pcListingBookmark
}>

// BaseRepository supplies the shared profile-setting visibility policy.
export class BookmarkRepository extends BaseRepository {
  static readonly selects = bookmarkSelects

  async bookmark(userId: string, listingId: string) {
    return this.handleDatabaseOperation(async () => {
      const listing = await this.prisma.listing.findUnique({
        where: { id: listingId },
        select: { id: true, status: true },
      })

      if (!listing) throw ResourceError.listing.notFound()
      if (listing.status !== ApprovalStatus.APPROVED) {
        throw ResourceError.bookmark.cannotBookmarkNonApproved()
      }

      return this.prisma.listingBookmark.upsert({
        where: { userId_listingId: { userId, listingId } },
        create: { userId, listingId },
        update: {},
        select: { id: true },
      })
    }, 'ListingBookmark')
  }

  async unbookmark(userId: string, listingId: string) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.listingBookmark.deleteMany({
          where: { userId, listingId },
        }),
      'ListingBookmark',
    )
  }

  async isBookmarked(userId: string, listingId: string): Promise<boolean> {
    return this.handleDatabaseOperation(async () => {
      const bookmark = await this.prisma.listingBookmark.findUnique({
        where: { userId_listingId: { userId, listingId } },
        select: { id: true },
      })
      return Boolean(bookmark)
    }, 'ListingBookmark')
  }

  async getBulkBookmarkStatuses(
    userId: string,
    listingIds: string[],
  ): Promise<Record<string, boolean>> {
    return this.handleDatabaseOperation(async () => {
      const bookmarks = await this.prisma.listingBookmark.findMany({
        where: { userId, listingId: { in: listingIds } },
        select: { listingId: true },
      })

      const bookmarkSet = new Set(bookmarks.map((b) => b.listingId))
      const statuses: Record<string, boolean> = {}
      for (const id of listingIds) {
        statuses[id] = bookmarkSet.has(id)
      }
      return statuses
    }, 'ListingBookmark')
  }

  async list(
    input: z.output<typeof GetListingBookmarksSchema>,
    ctx?: VisibilityContext,
  ): Promise<VisibilityGatedList<ListingBookmarkItem>> {
    return this.handleDatabaseOperation(async () => {
      const isHidden = await this.checkBookmarkVisibility(input.userId, ctx)
      if (isHidden) return hiddenList()

      const offset = calculateOffset({ page: input.page }, input.limit)
      const { where, orderBy } = buildListingBookmarkQuery(input)

      const [items, total] = await Promise.all([
        this.prisma.listingBookmark.findMany({
          where,
          select: BookmarkRepository.selects.listingBookmark,
          orderBy,
          skip: offset,
          take: input.limit,
        }),
        this.prisma.listingBookmark.count({ where }),
      ])

      return visibleList(items, paginate({ total, page: input.page, limit: input.limit }))
    }, 'ListingBookmark')
  }

  async pcBookmark(userId: string, pcListingId: string) {
    return this.handleDatabaseOperation(async () => {
      const pcListing = await this.prisma.pcListing.findUnique({
        where: { id: pcListingId },
        select: { id: true, status: true },
      })

      if (!pcListing) throw ResourceError.pcListing.notFound()
      if (pcListing.status !== ApprovalStatus.APPROVED) {
        throw ResourceError.bookmark.cannotBookmarkNonApproved()
      }

      return this.prisma.pcListingBookmark.upsert({
        where: { userId_pcListingId: { userId, pcListingId } },
        create: { userId, pcListingId },
        update: {},
        select: { id: true },
      })
    }, 'PcListingBookmark')
  }

  async pcUnbookmark(userId: string, pcListingId: string) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.pcListingBookmark.deleteMany({
          where: { userId, pcListingId },
        }),
      'PcListingBookmark',
    )
  }

  async isPcBookmarked(userId: string, pcListingId: string): Promise<boolean> {
    return this.handleDatabaseOperation(async () => {
      const bookmark = await this.prisma.pcListingBookmark.findUnique({
        where: { userId_pcListingId: { userId, pcListingId } },
        select: { id: true },
      })
      return Boolean(bookmark)
    }, 'PcListingBookmark')
  }

  async getBulkPcBookmarkStatuses(
    userId: string,
    pcListingIds: string[],
  ): Promise<Record<string, boolean>> {
    return this.handleDatabaseOperation(async () => {
      const bookmarks = await this.prisma.pcListingBookmark.findMany({
        where: { userId, pcListingId: { in: pcListingIds } },
        select: { pcListingId: true },
      })

      const bookmarkSet = new Set(bookmarks.map((b) => b.pcListingId))
      const statuses: Record<string, boolean> = {}
      for (const id of pcListingIds) {
        statuses[id] = bookmarkSet.has(id)
      }
      return statuses
    }, 'PcListingBookmark')
  }

  async pcList(
    input: z.output<typeof GetPcListingBookmarksSchema>,
    ctx?: VisibilityContext,
  ): Promise<VisibilityGatedList<PcListingBookmarkItem>> {
    return this.handleDatabaseOperation(async () => {
      const isHidden = await this.checkBookmarkVisibility(input.userId, ctx)
      if (isHidden) return hiddenList()

      const offset = calculateOffset({ page: input.page }, input.limit)
      const { where, orderBy } = buildPcListingBookmarkQuery(input)

      const [items, total] = await Promise.all([
        this.prisma.pcListingBookmark.findMany({
          where,
          select: BookmarkRepository.selects.pcListingBookmark,
          orderBy,
          skip: offset,
          take: input.limit,
        }),
        this.prisma.pcListingBookmark.count({ where }),
      ])

      return visibleList(items, paginate({ total, page: input.page, limit: input.limit }))
    }, 'PcListingBookmark')
  }

  async counts(
    userId: string,
    ctx?: VisibilityContext,
  ): Promise<VisibilityGatedCounts<{ listingBookmarks: number; pcListingBookmarks: number }>> {
    return this.handleDatabaseOperation(async () => {
      const isHidden = await this.checkBookmarkVisibility(userId, ctx)
      if (isHidden) return hiddenCounts()

      const [listingBookmarks, pcListingBookmarks] = await Promise.all([
        this.prisma.listingBookmark.count({
          where: {
            userId,
            listing: { status: ApprovalStatus.APPROVED, game: { status: ApprovalStatus.APPROVED } },
          },
        }),
        this.prisma.pcListingBookmark.count({
          where: {
            userId,
            pcListing: {
              status: ApprovalStatus.APPROVED,
              game: { status: ApprovalStatus.APPROVED },
            },
          },
        }),
      ])

      return visibleCounts({ listingBookmarks, pcListingBookmarks })
    }, 'ListingBookmark')
  }

  private async checkBookmarkVisibility(userId: string, ctx?: VisibilityContext): Promise<boolean> {
    return this.checkSettingVisibility(
      userId,
      ctx,
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { settings: { select: { bookmarksVisible: true } } },
        })
        return user?.settings?.bookmarksVisible
      },
      false,
    )
  }
}
