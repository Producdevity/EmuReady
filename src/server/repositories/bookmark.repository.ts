import { ResourceError } from '@/lib/errors'
import { paginate, calculateOffset } from '@/server/utils/pagination'
import { ApprovalStatus } from '@orm'
import { BaseRepository } from './base.repository'
import { hiddenList, visibleList, hiddenCounts, visibleCounts } from './types'
import type { VisibilityContext, VisibilityGatedList, VisibilityGatedCounts } from './types'
import type { Prisma } from '@orm'

const bookmarkSelects = {
  listingBookmark: {
    id: true,
    createdAt: true,
    listing: {
      select: {
        id: true,
        createdAt: true,
        status: true,
        successRate: true,
        _count: { select: { votes: true, comments: true } },
        author: { select: { id: true, name: true, profileImage: true } },
        game: {
          select: {
            id: true,
            title: true,
            system: { select: { id: true, name: true, key: true } },
          },
        },
        device: {
          select: {
            id: true,
            modelName: true,
            brand: { select: { id: true, name: true } },
          },
        },
        emulator: { select: { id: true, name: true, logo: true } },
        performance: { select: { id: true, label: true, rank: true, description: true } },
      },
    },
  } satisfies Prisma.ListingBookmarkSelect,

  pcListingBookmark: {
    id: true,
    createdAt: true,
    pcListing: {
      select: {
        id: true,
        createdAt: true,
        status: true,
        successRate: true,
        _count: { select: { votes: true, comments: true } },
        author: { select: { id: true, name: true, profileImage: true } },
        game: {
          select: {
            id: true,
            title: true,
            system: { select: { id: true, name: true, key: true } },
          },
        },
        cpu: {
          select: {
            id: true,
            modelName: true,
            brand: { select: { id: true, name: true } },
          },
        },
        gpu: {
          select: {
            id: true,
            modelName: true,
            brand: { select: { id: true, name: true } },
          },
        },
        emulator: { select: { id: true, name: true, logo: true } },
        performance: { select: { id: true, label: true, rank: true, description: true } },
      },
    },
  } satisfies Prisma.PcListingBookmarkSelect,
} as const

type ListingBookmarkItem = Prisma.ListingBookmarkGetPayload<{
  select: (typeof bookmarkSelects)['listingBookmark']
}>

type PcListingBookmarkItem = Prisma.PcListingBookmarkGetPayload<{
  select: (typeof bookmarkSelects)['pcListingBookmark']
}>

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
    userId: string,
    page: number,
    limit: number,
    ctx?: VisibilityContext,
    search?: string,
  ): Promise<VisibilityGatedList<ListingBookmarkItem>> {
    return this.handleDatabaseOperation(async () => {
      const isHidden = await this.checkBookmarkVisibility(userId, ctx)
      if (isHidden) return hiddenList()

      const offset = calculateOffset({ page }, limit)
      const where: Prisma.ListingBookmarkWhereInput = {
        userId,
        listing: {
          status: ApprovalStatus.APPROVED,
          ...(search ? { game: { title: { contains: search, mode: this.mode } } } : {}),
        },
      }

      const [items, total] = await Promise.all([
        this.prisma.listingBookmark.findMany({
          where,
          select: BookmarkRepository.selects.listingBookmark,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        this.prisma.listingBookmark.count({ where }),
      ])

      return visibleList(items, paginate({ total, page, limit }))
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
    userId: string,
    page: number,
    limit: number,
    ctx?: VisibilityContext,
    search?: string,
  ): Promise<VisibilityGatedList<PcListingBookmarkItem>> {
    return this.handleDatabaseOperation(async () => {
      const isHidden = await this.checkBookmarkVisibility(userId, ctx)
      if (isHidden) return hiddenList()

      const offset = calculateOffset({ page }, limit)
      const where: Prisma.PcListingBookmarkWhereInput = {
        userId,
        pcListing: {
          status: ApprovalStatus.APPROVED,
          ...(search ? { game: { title: { contains: search, mode: this.mode } } } : {}),
        },
      }

      const [items, total] = await Promise.all([
        this.prisma.pcListingBookmark.findMany({
          where,
          select: BookmarkRepository.selects.pcListingBookmark,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        this.prisma.pcListingBookmark.count({ where }),
      ])

      return visibleList(items, paginate({ total, page, limit }))
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
          where: { userId, listing: { status: ApprovalStatus.APPROVED } },
        }),
        this.prisma.pcListingBookmark.count({
          where: { userId, pcListing: { status: ApprovalStatus.APPROVED } },
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
